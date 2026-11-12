import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '../lib/constants'
import type { Status, Task } from '../lib/types'
import { SortableTaskCard } from './TaskCard'

interface ColumnProps {
  column: ColumnDef
  tasks: Task[]
  onAdd: (status: Status) => void
  onOpen: (task: Task) => void
  isDragging: boolean
}

const columnDropId = (status: Status) => `column:${status}`

export function Column({ column, tasks, onAdd, onOpen, isDragging }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(column.id), data: { type: 'column' } })

  return (
    <section
      aria-label={`${column.title} column`}
      className="flex max-h-full w-[85vw] max-w-[320px] flex-none snap-start flex-col rounded-xl bg-zinc-100/80 ring-1 ring-zinc-200/60 sm:w-[300px] lg:w-auto lg:max-w-none lg:min-w-[260px] lg:flex-1"
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={`size-2 rounded-full ${column.dot}`} aria-hidden />
        <h2 className="text-[13px] font-semibold text-zinc-800">{column.title}</h2>
        <span className="rounded-full bg-zinc-200/70 px-1.5 text-[11px] font-medium text-zinc-600 tabular-nums">
          {tasks.length}
        </span>
        <button
          type="button"
          onClick={() => onAdd(column.id)}
          className="ml-auto grid size-6 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="size-4" />
        </button>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`scroll-thin flex min-h-28 flex-1 flex-col gap-2 overflow-y-auto rounded-b-xl px-2 pb-2 transition-colors ${
            isOver ? 'bg-indigo-50/70' : ''
          }`}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}

          {tasks.length === 0 && (
            <button
              type="button"
              onClick={() => onAdd(column.id)}
              className={`flex min-h-24 flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 text-center text-xs transition ${
                isDragging
                  ? 'border-indigo-300 bg-white/60 text-indigo-600'
                  : 'border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600'
              }`}
            >
              {isDragging ? (
                'Drop here'
              ) : (
                <>
                  <span>{column.emptyHint}</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Plus className="size-3" /> Add task
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </SortableContext>
    </section>
  )
}
