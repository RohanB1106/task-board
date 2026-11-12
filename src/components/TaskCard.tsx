import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'
import { dueInfo, type DueTone } from '../lib/dates'
import { taskKey, type Task } from '../lib/types'
import { pick, useWorkspace } from '../lib/workspace'
import { AvatarStack } from './Avatar'
import { PriorityIcon } from './icons'

const DUE_STYLES: Record<DueTone, string> = {
  overdue: 'border-red-200 bg-red-50 text-red-700',
  today: 'border-amber-200 bg-amber-50 text-amber-800',
  soon: 'border-zinc-200 text-amber-700',
  later: 'border-zinc-200 text-zinc-600',
  done: 'border-zinc-200 text-zinc-400',
}

/** Small bordered property pill, as on Linear cards. */
function Pill({
  children,
  className = 'border-zinc-200 text-zinc-600',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-5 max-w-full items-center gap-1 rounded border px-1.5 text-[11px] font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

/** The visual card, shared by the in-column card and the drag overlay. */
export function TaskCardBody({ task, lifted = false }: { task: Task; lifted?: boolean }) {
  const isDone = task.status === 'done'
  const due = task.due_date ? dueInfo(task.due_date, isDone) : null
  const { membersById, labelsById } = useWorkspace()
  const assignees = pick(task.assignee_ids, membersById)
  const labels = pick(task.label_ids, labelsById)
  const key = taskKey(task)

  return (
    <div
      className={`rounded-md border bg-surface px-3 py-2.5 text-left transition-[border-color,box-shadow] ${
        lifted
          ? 'border-zinc-300 shadow-lg shadow-black/10'
          : 'border-zinc-200 shadow-[0_1px_1px_rgba(0,0,0,0.03)] group-hover:border-zinc-300'
      }`}
    >
      {key && <p className="mb-1 text-[11.5px] leading-4 text-zinc-500 tabular-nums">{key}</p>}

      <p className={`text-[13px] leading-[1.4] font-medium break-words ${isDone ? 'text-zinc-500' : 'text-zinc-900'}`}>
        {task.title}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Pill title={`${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`} className="border-zinc-200 px-1">
          <PriorityIcon priority={task.priority} size={12} />
        </Pill>
        {due && (
          <Pill className={DUE_STYLES[due.tone]} title={`Due ${task.due_date}`}>
            <CalendarDays className="size-3" />
            {due.label}
          </Pill>
        )}
        {labels.map((l) => (
          <Pill key={l.id}>
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="truncate">{l.name}</span>
          </Pill>
        ))}
        {task.description && <AlignLeft aria-label="Has description" className="ml-0.5 size-3 text-zinc-400" />}
        {assignees.length > 0 && (
          <span className="ml-auto pl-1">
            <AvatarStack members={assignees} />
          </span>
        )}
      </div>
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
      aria-label={`${taskKey(task) ?? ''} ${task.title}. Press space to move, O to open.`}
      className="group cursor-default touch-manipulation rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-panel"
    >
      {isDragging ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-100/60">
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
