import type { Priority, Status } from './types'

export interface ColumnDef {
  id: Status
  title: string
  /** Tailwind classes for the small status dot */
  dot: string
  /** Shown when the column has no tasks */
  emptyHint: string
}

export const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', dot: 'bg-zinc-400', emptyHint: 'Nothing planned yet' },
  { id: 'in_progress', title: 'In Progress', dot: 'bg-amber-500', emptyHint: 'Drag a task here to start it' },
  { id: 'in_review', title: 'In Review', dot: 'bg-violet-500', emptyHint: 'Nothing waiting on review' },
  { id: 'done', title: 'Done', dot: 'bg-emerald-500', emptyHint: 'Finished work lands here' },
]

export const STATUS_LABEL: Record<Status, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c.title]),
) as Record<Status, string>

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
]

/** Gap between task positions; new tasks go 1000 below the last one. */
export const POSITION_STEP = 1000
