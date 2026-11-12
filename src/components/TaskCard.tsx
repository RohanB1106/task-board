import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, CalendarDays, SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import { dueInfo, type DueTone } from '../lib/dates'
import type { Priority, Task } from '../lib/types'

const DUE_STYLES: Record<DueTone, string> = {
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  today: 'bg-amber-50 text-amber-800 ring-amber-200',
  soon: 'bg-amber-50/60 text-amber-700 ring-amber-100',
  later: 'bg-zinc-50 text-zinc-600 ring-zinc-200',
  done: 'bg-zinc-50 text-zinc-400 ring-zinc-200',
}

export function PriorityIcon({ priority, className = '' }: { priority: Priority; className?: string }) {
  if (priority === 'high')
    return <SignalHigh aria-label="High priority" className={`size-4 text-red-500 ${className}`} />
  if (priority === 'low')
    return <SignalLow aria-label="Low priority" className={`size-4 text-zinc-400 ${className}`} />
  return <SignalMedium aria-label="Normal priority" className={`size-4 text-zinc-500 ${className}`} />
}

/** The visual card, shared by the in-column card and the drag overlay. */
export function TaskCardBody({ task, lifted = false }: { task: Task; lifted?: boolean }) {
  const isDone = task.status === 'done'
  const due = task.due_date ? dueInfo(task.due_date, isDone) : null

  return (
    <div
      className={[
        'rounded-lg border bg-white p-3 text-left transition-[box-shadow,border-color]',
        lifted
          ? 'rotate-[1.5deg] border-zinc-300 shadow-xl shadow-zinc-900/10'
          : 'border-zinc-200/80 shadow-[0_1px_2px_rgba(24,24,27,0.05)] group-hover:border-zinc-300 group-hover:shadow-md group-hover:shadow-zinc-900/5',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <p
          className={`min-w-0 flex-1 text-[13.5px] leading-snug font-medium break-words ${
            isDone ? 'text-zinc-500' : 'text-zinc-900'
          }`}
        >
          {task.title}
        </p>
        <PriorityIcon priority={task.priority} className="mt-px shrink-0" />
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{task.description}</p>
      )}

      {(due || task.description) && (
        <div className="mt-2.5 flex items-center gap-2">
          {due && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${DUE_STYLES[due.tone]}`}
            >
              <CalendarDays className="size-3" />
              {due.label}
            </span>
          )}
          {task.description && <AlignLeft aria-label="Has description" className="size-3.5 text-zinc-300" />}
        </div>
      )}
    </div>
  )
}

/** A card that can be dragged within and between columns. */
export function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        // Space/Enter pick the card up for keyboard dragging; "o" opens it.
        if (e.key === 'o') onOpen(task)
        listeners?.onKeyDown?.(e)
      }}
      aria-label={`${task.title}. Press space to move, O to open.`}
      className={`group cursor-grab touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {isDragging ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
          <div className="invisible">
            <TaskCardBody task={task} />
          </div>
        </div>
      ) : (
        <TaskCardBody task={task} />
      )}
    </div>
  )
}
