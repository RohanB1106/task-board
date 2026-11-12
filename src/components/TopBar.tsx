import { ChevronRight, Menu, Plus, Search, X } from 'lucide-react'
import { forwardRef } from 'react'

interface TopBarProps {
  search: string
  onSearch: (value: string) => void
  onNewTask: () => void
  onOpenMenu: () => void
}

/** Breadcrumb, search and the primary action, Linear-style. */
export const TopBar = forwardRef<HTMLInputElement, TopBarProps>(function TopBar(
  { search, onSearch, onNewTask, onOpenMenu },
  searchRef,
) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-200/70 lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        <span className="hidden truncate text-zinc-500 sm:inline">Guest workspace</span>
        <ChevronRight className="hidden size-3.5 shrink-0 text-zinc-400 sm:block" />
        <span className="font-medium text-zinc-900">Board</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <SearchBox ref={searchRef} value={search} onChange={onSearch} className="hidden w-56 sm:block md:w-64" />
        <button
          type="button"
          onClick={onNewTask}
          title="New task (N)"
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[13px] font-medium text-white shadow-xs transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          New task
        </button>
      </div>
    </header>
  )
})

export const SearchBox = forwardRef<
  HTMLInputElement,
  { value: string; onChange: (value: string) => void; className?: string }
>(function SearchBox({ value, onChange, className = '' }, ref) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-zinc-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('')
            e.currentTarget.blur()
          }
        }}
        placeholder="Search tasks"
        aria-label="Search tasks by title"
        className="h-7 w-full rounded-md border border-zinc-200 bg-surface pr-7 pl-7 text-[13px] outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-accent focus:ring-2 focus:ring-accent/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 grid size-4 -translate-y-1/2 place-items-center rounded text-zinc-400 hover:text-zinc-700"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-1.5 grid min-w-4 -translate-y-1/2 place-items-center rounded border border-zinc-200 px-1 font-sans text-[10px] leading-4 text-zinc-400">
          /
        </kbd>
      )}
    </div>
  )
})
