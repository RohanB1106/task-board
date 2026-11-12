import { Kanban, Monitor, Moon, Plus, Sun, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTheme, type ThemeChoice } from '../hooks/useTheme'
import { isOverdue } from '../lib/dates'
import type { Filters } from '../lib/filters'
import type { Label, Task, TeamMember } from '../lib/types'
import { Avatar } from './Avatar'
import { LogoMark } from './icons'

interface SidebarProps {
  userId: string
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  filters: Filters
  onToggleAssignee: (id: string) => void
  onToggleLabel: (id: string) => void
  onManageTeam: () => void
  /** Mobile drawer state; on large screens the sidebar is always visible */
  open: boolean
  onClose: () => void
}

export function Sidebar(props: SidebarProps) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:flex">
        <SidebarContent {...props} />
      </aside>
      {props.open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={props.onClose} />
          <aside className="animate-drawer-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] bg-app shadow-xl">
            <SidebarContent {...props} />
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Close menu"
              className="absolute top-3 right-3 grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-200/70"
            >
              <X className="size-4" />
            </button>
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({
  userId,
  tasks,
  members,
  labels,
  filters,
  onToggleAssignee,
  onToggleLabel,
  onManageTeam,
}: SidebarProps) {
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status === 'done')).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="flex h-full w-full flex-col px-3 py-3">
      {/* Workspace */}
      <div className="flex items-center gap-2.5 px-1.5 py-1">
        <LogoMark className="size-6" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-zinc-900">Guest workspace</p>
          <p className="truncate font-mono text-[10.5px] text-zinc-500">{userId.slice(0, 8)}</p>
        </div>
      </div>

      <nav className="mt-4 space-y-px" aria-label="Views">
        <a
          href="#"
          aria-current="page"
          onClick={(e) => e.preventDefault()}
          className="flex h-7 items-center gap-2 rounded-md bg-zinc-200/70 px-2 text-[13px] font-medium text-zinc-900"
        >
          <Kanban className="size-4 text-zinc-500" />
          Board
          <span className="ml-auto text-xs text-zinc-500 tabular-nums">{tasks.length}</span>
        </a>
      </nav>

      <div className="scroll-thin mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto">
        {/* Summary */}
        <section aria-label="Board summary" className="px-2">
          <SectionTitle>Summary</SectionTitle>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            <span className="font-medium text-zinc-800 tabular-nums">{pct}%</span> complete
          </p>
          <dl className="mt-2.5 grid grid-cols-3 gap-1 text-center">
            <Stat label="Total" value={tasks.length} />
            <Stat label="Done" value={done} />
            <Stat label="Overdue" value={overdue} danger={overdue > 0} />
          </dl>
        </section>

        {/* Team */}
        <section aria-label="Team">
          <SectionHeader title="Team" onAdd={onManageTeam} addLabel="Manage team" />
          <ul className="mt-1 space-y-px">
            {members.length === 0 && (
              <EmptyRow onClick={onManageTeam}>Add teammates</EmptyRow>
            )}
            {members.map((m) => (
              <FilterRow
                key={m.id}
                active={filters.assignees.includes(m.id)}
                onClick={() => onToggleAssignee(m.id)}
                count={tasks.filter((t) => t.assignee_ids.includes(m.id)).length}
                title={`Show tasks assigned to ${m.name}`}
              >
                <Avatar member={m} size="xs" />
                <span className="truncate">{m.name}</span>
              </FilterRow>
            ))}
          </ul>
        </section>

        {/* Labels */}
        <section aria-label="Labels">
          <SectionHeader title="Labels" onAdd={onManageTeam} addLabel="Manage labels" />
          <ul className="mt-1 space-y-px">
            {labels.length === 0 && <EmptyRow onClick={onManageTeam}>Create labels</EmptyRow>}
            {labels.map((l) => (
              <FilterRow
                key={l.id}
                active={filters.labels.includes(l.id)}
                onClick={() => onToggleLabel(l.id)}
                count={tasks.filter((t) => t.label_ids.includes(l.id)).length}
                title={`Show tasks labelled ${l.name}`}
              >
                <span className="grid size-5 place-items-center">
                  <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
                </span>
                <span className="truncate">{l.name}</span>
              </FilterRow>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-3 space-y-2.5 border-t border-zinc-200 px-1 pt-3">
        <ThemeSwitch />
        <p className="hidden px-1 text-[11px] text-zinc-500 [@media(hover:hover)]:block">
          <Kbd>N</Kbd> new task <span className="mx-1 text-zinc-300">·</span> <Kbd>/</Kbd> search
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[11px] font-medium text-zinc-500">{children}</h2>
}

function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="group flex h-6 items-center px-2">
      <SectionTitle>{title}</SectionTitle>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title={addLabel}
        className="ml-auto grid size-5 place-items-center rounded text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

function FilterRow({
  active,
  onClick,
  count,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  title: string
  children: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        title={title}
        className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
          active ? 'bg-accent-soft font-medium text-accent-fg' : 'text-zinc-700 hover:bg-zinc-200/60'
        }`}
      >
        {children}
        <span className={`ml-auto text-xs tabular-nums ${active ? 'text-accent-fg' : 'text-zinc-400'}`}>{count}</span>
      </button>
    </li>
  )
}

function EmptyRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800"
      >
        <Plus className="size-3.5" />
        {children}
      </button>
    </li>
  )
}

function Stat({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-md bg-zinc-200/50 px-1 py-1.5">
      <dd className={`text-sm font-semibold tabular-nums ${danger ? 'text-red-600' : 'text-zinc-900'}`}>{value}</dd>
      <dt className="text-[10.5px] text-zinc-500">{label}</dt>
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-4 place-items-center rounded border border-zinc-300 bg-surface px-1 font-sans text-[10px] leading-4 text-zinc-600">
      {children}
    </kbd>
  )
}

const THEME_OPTIONS: { id: ThemeChoice; label: string; icon: ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun className="size-3.5" /> },
  { id: 'dark', label: 'Dark', icon: <Moon className="size-3.5" /> },
  { id: 'system', label: 'System', icon: <Monitor className="size-3.5" /> },
]

function ThemeSwitch() {
  const { choice, setChoice } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-0.5 rounded-lg bg-zinc-200/60 p-0.5">
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={choice === o.id}
          title={`${o.label} theme`}
          onClick={() => setChoice(o.id)}
          className={`flex h-6 items-center justify-center gap-1 rounded-md text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            choice === o.id ? 'bg-surface text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
