import type { Priority, Task } from './types'

export const UNASSIGNED = '__unassigned'

export interface Filters {
  search: string
  priorities: Priority[]
  assignees: string[] // member ids, or UNASSIGNED
  labels: string[]
}

export const EMPTY_FILTERS: Filters = { search: '', priorities: [], assignees: [], labels: [] }

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.search.trim() || f.priorities.length || f.assignees.length || f.labels.length)
}

/** Options within one filter are OR-ed; different filters are AND-ed. */
export function matchesFilters(task: Task, f: Filters): boolean {
  const q = f.search.trim().toLowerCase()
  if (q && !task.title.toLowerCase().includes(q) && !(task.description ?? '').toLowerCase().includes(q)) {
    return false
  }
  if (f.priorities.length && !f.priorities.includes(task.priority)) return false
  if (f.assignees.length) {
    const unassignedOk = f.assignees.includes(UNASSIGNED) && task.assignee_ids.length === 0
    if (!unassignedOk && !task.assignee_ids.some((id) => f.assignees.includes(id))) return false
  }
  if (f.labels.length && !task.label_ids.some((id) => f.labels.includes(id))) return false
  return true
}
