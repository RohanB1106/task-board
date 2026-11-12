import type { ReactNode } from 'react'
import { CircleCheck, CircleDashed, Clock, Plus } from 'lucide-react'
import { isOverdue } from '../lib/dates'
import type { Task } from '../lib/types'

function Stat({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500" title={label}>
      <span className={tone}>{icon}</span>
      <span className="font-semibold text-zinc-800 tabular-nums">{value}</span>
      <span className="hidden md:inline">{label}</span>
    </div>
  )
}

export function Header({ tasks, userId, onNewTask }: { tasks: Task[]; userId: string; onNewTask: () => void }) {
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status === 'done')).length

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-4 pb-4 sm:px-6 sm:pt-6">
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="size-8" />
        <div>
          <h1 className="text-[15px] leading-tight font-semibold text-zinc-900">My Board</h1>
          <p className="text-xs text-zinc-500">
            Guest workspace · <span className="font-mono text-[11px]">{userId.slice(0, 8)}</span>
          </p>
        </div>
      </div>

      <div className="order-3 flex w-full items-center gap-4 rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200 sm:order-none sm:ml-auto sm:w-auto">
        <Stat icon={<CircleDashed className="size-3.5" />} value={tasks.length} label="total" tone="text-zinc-400" />
        <Stat icon={<CircleCheck className="size-3.5" />} value={done} label="done" tone="text-emerald-500" />
        <Stat
          icon={<Clock className="size-3.5" />}
          value={overdue}
          label="overdue"
          tone={overdue ? 'text-red-500' : 'text-zinc-400'}
        />
      </div>

      <button
        type="button"
        onClick={onNewTask}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:ml-0"
      >
        <Plus className="size-4" />
        New task
        <kbd className="ml-1 hidden rounded bg-indigo-500 px-1.5 font-sans text-[10px] text-indigo-100 sm:inline">
          N
        </kbd>
      </button>
    </header>
  )
}
