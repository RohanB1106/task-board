import { useCallback, useEffect, useState } from 'react'
import { POSITION_STEP } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Task, TaskInput, TaskLinks } from '../lib/types'

type LoadState = 'loading' | 'ready' | 'error'

type TaskRow = Omit<Task, 'assignee_ids' | 'label_ids'> & {
  task_assignees?: { member_id: string }[]
  task_labels?: { label_id: string }[]
}

const TASK_SELECT = '*, task_assignees(member_id), task_labels(label_id)'

function fromRow({ task_assignees, task_labels, ...rest }: TaskRow): Task {
  return {
    ...rest,
    assignee_ids: task_assignees?.map((a) => a.member_id) ?? [],
    label_ids: task_labels?.map((l) => l.label_id) ?? [],
  }
}

/** Insert / delete join-table rows so the task ends up linked to exactly `next`. */
async function syncLinks(
  table: 'task_assignees' | 'task_labels',
  column: 'member_id' | 'label_id',
  taskId: string,
  current: string[],
  next: string[],
) {
  const add = next.filter((id) => !current.includes(id))
  const remove = current.filter((id) => !next.includes(id))
  if (add.length) {
    const { error } = await supabase.from(table).insert(add.map((id) => ({ task_id: taskId, [column]: id })))
    if (error) throw new Error(error.message)
  }
  if (remove.length) {
    const { error } = await supabase.from(table).delete().eq('task_id', taskId).in(column, remove)
    if (error) throw new Error(error.message)
  }
}

/**
 * Loads the guest's tasks (with assignees and labels) and exposes mutations.
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
      .select(TASK_SELECT)
      .order('position', { ascending: true })
    if (error) {
      setLoadError(error.message)
      setLoadState('error')
      return
    }
    setTasks((data as TaskRow[]).map(fromRow))
    setLoadState('ready')
  }, [])

  // Initial load (state already starts as 'loading')
  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks, userId])

  /** Retry after an error: show the skeleton again, then refetch. */
  const reload = useCallback(() => {
    setLoadState('loading')
    setLoadError(null)
    void fetchTasks()
  }, [fetchTasks])

  const patchLocal = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const setLinks = useCallback(
    async (id: string, links: TaskLinks) => {
      const previous = tasks.find((t) => t.id === id)
      if (!previous) return
      patchLocal(id, links)
      try {
        await syncLinks('task_assignees', 'member_id', id, previous.assignee_ids, links.assignee_ids)
        await syncLinks('task_labels', 'label_id', id, previous.label_ids, links.label_ids)
      } catch (err) {
        // Re-read the truth from the server rather than guessing which half applied
        void fetchTasks()
        throw err
      }
    },
    [tasks, patchLocal, fetchTasks],
  )

  const createTask = useCallback(
    async (input: TaskInput, links: TaskLinks = { assignee_ids: [], label_ids: [] }) => {
      const inColumn = tasks.filter((t) => t.status === input.status)
      const position = inColumn.length
        ? Math.max(...inColumn.map((t) => t.position)) + POSITION_STEP
        : POSITION_STEP
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, position, user_id: userId })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      const task = fromRow(data as TaskRow)
      setTasks((prev) => [...prev, task])
      if (links.assignee_ids.length || links.label_ids.length) {
        await syncLinks('task_assignees', 'member_id', task.id, [], links.assignee_ids)
        await syncLinks('task_labels', 'label_id', task.id, [], links.label_ids)
        patchLocal(task.id, links)
      }
      return task
    },
    [tasks, userId, patchLocal],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskInput> & { position?: number }) => {
      const previous = tasks.find((t) => t.id === id)
      if (!previous) return
      patchLocal(id, patch)
      const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*').single()
      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)))
        throw new Error(error.message)
      }
      // Keep the locally known links; the update response doesn't include them
      const { task_assignees: _a, task_labels: _l, ...fresh } = data as TaskRow
      patchLocal(id, fresh)
    },
    [tasks, patchLocal],
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

  /** After a member / label is deleted, its links disappear by cascade; mirror that locally. */
  const forgetMember = useCallback((memberId: string) => {
    setTasks((prev) => prev.map((t) => ({ ...t, assignee_ids: t.assignee_ids.filter((x) => x !== memberId) })))
  }, [])
  const forgetLabel = useCallback((labelId: string) => {
    setTasks((prev) => prev.map((t) => ({ ...t, label_ids: t.label_ids.filter((x) => x !== labelId) })))
  }, [])

  return {
    tasks,
    loadState,
    loadError,
    reload,
    createTask,
    updateTask,
    setLinks,
    deleteTask,
    forgetMember,
    forgetLabel,
  }
}
