import { Search, Settings2, SignalHigh, Tag, UserRound, X } from 'lucide-react'
import { forwardRef } from 'react'
import { PRIORITIES } from '../lib/constants'
import { UNASSIGNED, hasActiveFilters, type Filters } from '../lib/filters'
import type { Label, Priority, TeamMember } from '../lib/types'
import { Avatar, AvatarStack } from './Avatar'
import { FilterMenu } from './FilterMenu'
import { PriorityIcon } from './TaskCard'

interface ToolbarProps {
  filters: Filters
  onChange: (next: Filters) => void
  members: TeamMember[]
  labels: Label[]
  shown: number
  total: number
  onManageTeam: () => void
}

export const Toolbar = forwardRef<HTMLInputElement, ToolbarProps>(function Toolbar(
  { filters, onChange, members, labels, shown, total, onManageTeam },
  searchRef,
) {
  const active = hasActiveFilters(filters)
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          ref={searchRef}
          type="search"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              set('search', '')
              e.currentTarget.blur()
            }
          }}
          placeholder="Search tasks…"
          aria-label="Search tasks by title"
          className="h-8 w-full rounded-lg border border-zinc-200 bg-white pr-8 pl-8 text-sm shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => set('search', '')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-zinc-200 px-1 font-sans text-[10px] text-zinc-400 sm:block">
            /
          </kbd>
        )}
      </div>

      <FilterMenu
        label="Priority"
        icon={<SignalHigh className="size-3.5" />}
        options={PRIORITIES.map((p) => ({ id: p.id, label: p.label, icon: <PriorityIcon priority={p.id} className="size-3.5" /> }))}
        selected={filters.priorities}
        onChange={(v) => set('priorities', v as Priority[])}
      />
      <FilterMenu
        label="Assignee"
        icon={<UserRound className="size-3.5" />}
        options={[
          { id: UNASSIGNED, label: 'Unassigned', icon: <span className="size-5 rounded-full border border-dashed border-zinc-300" /> },
          ...members.map((m) => ({ id: m.id, label: m.name, icon: <Avatar member={m} size="xs" /> })),
        ]}
        selected={filters.assignees}
        onChange={(v) => set('assignees', v)}
      />
      <FilterMenu
        label="Label"
        icon={<Tag className="size-3.5" />}
        options={labels.map((l) => ({
          id: l.id,
          label: l.name,
          icon: <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />,
        }))}
        selected={filters.labels}
        onChange={(v) => set('labels', v)}
        emptyText="No labels yet. Create some in Team & labels."
      />

      {active && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="tabular-nums">
            {shown} of {total}
          </span>
          <button
            type="button"
            onClick={() => onChange({ search: '', priorities: [], assignees: [], labels: [] })}
            className="rounded-md px-1.5 py-1 font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
          >
            Clear all
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onManageTeam}
        className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg bg-white px-2.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-900"
      >
        {members.length > 0 ? <AvatarStack members={members} max={4} /> : <Settings2 className="size-3.5 text-zinc-400" />}
        Team &amp; labels
      </button>
    </div>
  )
})
