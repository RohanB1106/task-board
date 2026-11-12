import { ListFilter, Tag, UserRound } from 'lucide-react'
import { PRIORITIES } from '../lib/constants'
import { UNASSIGNED, hasActiveFilters, type Filters } from '../lib/filters'
import type { Label, Priority, TeamMember } from '../lib/types'
import { Avatar } from './Avatar'
import { FilterMenu } from './FilterMenu'
import { PriorityIcon } from './icons'
import { SearchBox } from './TopBar'

interface FilterBarProps {
  filters: Filters
  onChange: (next: Filters) => void
  members: TeamMember[]
  labels: Label[]
  shown: number
  total: number
}

export function FilterBar({ filters, onChange, members, labels, shown, total }: FilterBarProps) {
  const active = hasActiveFilters(filters)
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-zinc-200 px-3 py-2 sm:px-4">
      {/* On phones the search box lives here instead of the top bar */}
      <SearchBox value={filters.search} onChange={(v) => set('search', v)} className="w-full sm:hidden" />

      <FilterMenu
        label="Priority"
        icon={<ListFilter className="size-3.5" />}
        options={PRIORITIES.map((p) => ({ id: p.id, label: p.label, icon: <PriorityIcon priority={p.id} /> }))}
        selected={filters.priorities}
        onChange={(v) => set('priorities', v as Priority[])}
      />
      <FilterMenu
        label="Assignee"
        icon={<UserRound className="size-3.5" />}
        options={[
          {
            id: UNASSIGNED,
            label: 'No assignee',
            icon: <span className="size-5 rounded-full border border-dashed border-zinc-400" />,
          },
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
          icon: (
            <span className="grid size-5 place-items-center">
              <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
            </span>
          ),
        }))}
        selected={filters.labels}
        onChange={(v) => set('labels', v)}
        emptyText="No labels yet"
      />

      <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
        {active ? (
          <>
            <span className="tabular-nums">
              {shown} of {total}
            </span>
            <button
              type="button"
              onClick={() => onChange({ search: '', priorities: [], assignees: [], labels: [] })}
              className="rounded px-1.5 py-0.5 font-medium text-zinc-700 hover:bg-zinc-200/70"
            >
              Clear
            </button>
          </>
        ) : (
          <span className="tabular-nums">
            {total} {total === 1 ? 'task' : 'tasks'}
          </span>
        )}
      </div>
    </div>
  )
}
