import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '../lib/constants'
import type { Status, Task } from '../lib/types'
import { StatusIcon } from './icons'
import { SortableTaskCard } from './TaskCard'

interface ColumnProps {
  column: ColumnDef
  tasks: Task[]
  onAdd: (status: Status) => void
  onOpen: (task: Task) => void
  isDragging: boolean
  filtering: boolean
}

export function Column({ column, tasks, onAdd, onOpen, isDragging, filtering }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}`, data: { type: 'column' } })

  return (
    <section
      aria-label={`${column.title} column`}
      className="group/col flex max-h-full w-[min(284px,82vw)] shrink-0 snap-start flex-col"
    >
      <header className="flex h-9 shrink-0 items-center gap-2 px-1.5">
        <StatusIcon status={column.id} />
        <h2 className="text-[13px] font-medium text-zinc-900">{column.title}</h2>
        <span className="text-[13px] text-zinc-400 tabular-nums">{tasks.length}</span>
        <button
          type="button"
          onClick={() => onAdd(column.id)}
          className="ml-auto grid size-6 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-200/70 hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label={`Add task to ${column.title}`}
          title={`Add task to ${column.title}`}
        >
          <Plus className="size-4" />
        </button>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`scroll-thin flex min-h-24 flex-1 flex-col gap-1.5 overflow-y-auto rounded-lg p-1 transition-colors ${
            isOver ? 'bg-zinc-200/50' : ''
          }`}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}

          {tasks.length === 0 && isDragging && (
            <div className="h-20 shrink-0 rounded-md border border-dashed border-zinc-300" aria-hidden />
          )}
          {tasks.length === 0 && !isDragging && filtering && (
            <p className="px-2 py-3 text-xs text-zinc-400">No matching tasks</p>
          )}

          {!isDragging && (
            <button
              type="button"
              onClick={() => onAdd(column.id)}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800 focus-visible:opacity-100 ${
                tasks.length ? 'opacity-0 group-hover/col:opacity-100 [@media(hover:none)]:opacity-100' : ''
              }`}
            >
              <Plus className="size-3.5" />
              Add task
            </button>
          )}
        </div>
      </SortableContext>
    </section>
  )
}
