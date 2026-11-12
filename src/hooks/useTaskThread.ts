import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Activity, Comment } from '../lib/types'

type ThreadState = 'loading' | 'ready' | 'error'

/**
 * Comments and activity history for one task, loaded when its panel opens.
 * Changing `refreshKey` (e.g. the task's updated_at) refetches the history.
 */
export function useTaskThread(taskId: string, refreshKey = '') {
  const [comments, setComments] = useState<Comment[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [state, setState] = useState<ThreadState>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase
        .from('comments')
        .select('id, task_id, body, created_at')
        .eq('task_id', taskId)
        .order('created_at'),
      supabase
        .from('task_activity')
        .select('id, task_id, action, details, created_at')
        .eq('task_id', taskId)
        .order('created_at'),
    ]).then(([c, a]) => {
      if (cancelled) return
      if (c.error || a.error) {
        setState('error')
        return
      }
      setComments(c.data as Comment[])
      setActivity(a.data as Activity[])
      setState('ready')
    })
    return () => {
      cancelled = true
    }
  }, [taskId, attempt, refreshKey])

  const retry = useCallback(() => {
    setState('loading')
    setAttempt((n) => n + 1)
  }, [])

  const addComment = useCallback(
    async (body: string) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, body })
        .select('id, task_id, body, created_at')
        .single()
      if (error) throw new Error(error.message)
      setComments((prev) => [...prev, data as Comment])
    },
    [taskId],
  )

  const deleteComment = useCallback(async (id: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { comments, activity, state, retry, addComment, deleteComment }
}
