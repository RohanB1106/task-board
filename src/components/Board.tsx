import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { COLUMNS, POSITION_STEP } from '../lib/constants'
import type { Status, Task } from '../lib/types'
import { Column } from './Column'
import { TaskCardBody } from './TaskCard'

type ColumnMap = Record<Status, string[]>

interface BoardProps {
  tasks: Task[]
  /** Search / filters are hiding some tasks */
  filtering?: boolean
  onMove: (id: string, status: Status, position: number) => void
  onAdd: (status: Status) => void
  onOpen: (task: Task) => void
}

function groupByStatus(tasks: Task[]): ColumnMap {
  const map: ColumnMap = { todo: [], in_progress: [], in_review: [], done: [] }
  const sorted = [...tasks].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  )
  for (const task of sorted) map[task.status].push(task.id)
  return map
}

function findColumn(map: ColumnMap, id: UniqueIdentifier): Status | null {
  const key = String(id)
  if (key.startsWith('column:')) return key.slice('column:'.length) as Status
  return (Object.keys(map) as Status[]).find((s) => map[s].includes(key)) ?? null
}

/** Position halfway between the new neighbours, so only the moved task is written. */
function positionBetween(prev?: Task, next?: Task): number {
  if (prev && next) return (prev.position + next.position) / 2
  if (prev) return prev.position + POSITION_STEP
  if (next) return next.position - POSITION_STEP
  return POSITION_STEP
}

export function Board({ tasks, filtering = false, onMove, onAdd, onOpen }: BoardProps) {
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const settled = useMemo(() => groupByStatus(tasks), [tasks])

  // While dragging we keep a scratch copy of the columns so cards can hop
  // between columns live; it's discarded once the drop is saved.
  const [draft, setDraft] = useState<ColumnMap | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const columns = draft ?? settled
  const activeTask = activeId ? byId.get(activeId) : undefined

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
    setDraft(settled)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    setDraft((current) => {
      const map = current ?? settled
      const from = findColumn(map, active.id)
      const to = findColumn(map, over.id)
      if (!from || !to || from === to) return current

      const id = String(active.id)
      const target = map[to]
      const overIndex = target.indexOf(String(over.id))
      const insertAt = overIndex === -1 ? target.length : overIndex
      return {
        ...map,
        [from]: map[from].filter((x) => x !== id),
        [to]: [...target.slice(0, insertAt), id, ...target.slice(insertAt)],
      }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const map = draft ?? settled
    setActiveId(null)
    setDraft(null)
    if (!over) return

    const id = String(active.id)
    const column = findColumn(map, id)
    if (!column) return

    let list = map[column]
    const overIndex = list.indexOf(String(over.id))
    const fromIndex = list.indexOf(id)
    if (overIndex !== -1 && overIndex !== fromIndex) list = arrayMove(list, fromIndex, overIndex)

    const index = list.indexOf(id)
    const task = byId.get(id)
    if (!task) return

    const unchanged = task.status === column && settled[column].indexOf(id) === index
    if (unchanged) return

    const position = positionBetween(byId.get(list[index - 1]), byId.get(list[index + 1]))
    onMove(id, column, position)
  }

  function handleDragCancel() {
    setActiveId(null)
    setDraft(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="scroll-thin flex h-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:snap-none sm:px-6 lg:gap-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={columns[column.id].map((id) => byId.get(id)).filter((t): t is Task => Boolean(t))}
            onAdd={onAdd}
            onOpen={onOpen}
            isDragging={activeId !== null}
            filtering={filtering}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask ? (
          <div className="cursor-grabbing">
            <TaskCardBody task={activeTask} lifted />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export function BoardSkeleton() {
  const counts = [3, 2, 1, 2]
  return (
    <div className="flex h-full gap-3 overflow-hidden px-4 sm:px-6 lg:gap-4" aria-busy="true" aria-label="Loading tasks">
      {COLUMNS.map((column, i) => (
        <div
          key={column.id}
          className="flex w-[85vw] max-w-[320px] flex-none flex-col gap-2 self-start rounded-xl bg-zinc-100/80 p-3 ring-1 ring-zinc-200/60 sm:w-[300px] lg:w-auto lg:max-w-none lg:min-w-[260px] lg:flex-1"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className={`size-2 rounded-full ${column.dot}`} />
            <span className="text-[13px] font-semibold text-zinc-400">{column.title}</span>
          </div>
          {Array.from({ length: counts[i] }, (_, j) => (
            <div key={j} className="animate-pulse rounded-lg border border-zinc-200/70 bg-white p-3">
              <div className="h-3 w-3/4 rounded bg-zinc-200" />
              <div className="mt-2 h-2.5 w-1/2 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
