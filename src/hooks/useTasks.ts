import { useCallback, useEffect, useState } from 'react'
import { POSITION_STEP } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Task, TaskInput } from '../lib/types'

type LoadState = 'loading' | 'ready' | 'error'

/**
 * Loads the guest's tasks and exposes create / update / delete.
 * Updates are optimistic: the UI changes immediately and rolls back
 * if Supabase rejects the write.
 */
export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
    if (error) {
      setLoadError(error.message)
      setLoadState('error')
      return
    }
    setTasks(data as Task[])
    setLoadState('ready')
  }, [])

  // Initial load (state already starts as 'loading')
  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks, userId])

  /** Retry after an error: show the skeleton again, then refetch. */
  const load = useCallback(() => {
    setLoadState('loading')
    setLoadError(null)
    void fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(
    async (input: TaskInput) => {
      const inColumn = tasks.filter((t) => t.status === input.status)
      const position = inColumn.length
        ? Math.max(...inColumn.map((t) => t.position)) + POSITION_STEP
        : POSITION_STEP
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, position, user_id: userId })
        .select()
        .single()
      if (error) throw new Error(error.message)
      setTasks((prev) => [...prev, data as Task])
      return data as Task
    },
    [tasks, userId],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskInput> & { position?: number }) => {
      const previous = tasks.find((t) => t.id === id)
      if (!previous) return
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)))
        throw new Error(error.message)
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
    },
    [tasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const previous = tasks.find((t) => t.id === id)
      if (!previous) return
      setTasks((prev) => prev.filter((t) => t.id !== id))
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) {
        setTasks((prev) => [...prev, previous])
        throw new Error(error.message)
      }
    },
    [tasks],
  )

  return { tasks, loadState, loadError, reload: load, createTask, updateTask, deleteTask }
}
