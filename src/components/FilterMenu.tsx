import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface FilterOption {
  id: string
  label: string
  icon?: ReactNode
}

interface FilterMenuProps {
  label: string
  icon: ReactNode
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
  emptyText?: string
}

/** A button that opens a small checkbox list. */
export function FilterMenu({ label, icon, options, selected, onChange, emptyText }: FilterMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const active = selected.length > 0
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs sm:px-2.5 font-medium ring-1 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
          active
            ? 'bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100'
            : 'bg-surface text-zinc-600 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
        }`}
      >
        <span className={`hidden sm:inline ${active ? 'text-indigo-500' : 'text-zinc-400'}`}>{icon}</span>
        {label}
        {active && (
          <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] leading-4 text-white tabular-nums">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`size-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-dialog-in absolute left-0 z-30 mt-1.5 w-56 rounded-xl bg-surface p-1 shadow-lg shadow-black/10 ring-1 ring-zinc-200">
          {options.length === 0 && <p className="px-2.5 py-2 text-xs text-zinc-500">{emptyText ?? 'Nothing to filter by yet'}</p>}
          {options.map((o) => {
            const checked = selected.includes(o.id)
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                onClick={() => toggle(o.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-100"
              >
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded border transition ${
                    checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300 bg-surface'
                  }`}
                >
                  {checked && <Check className="size-3" strokeWidth={3} />}
                </span>
                {o.icon}
                <span className="truncate">{o.label}</span>
              </button>
            )
          })}
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg border-t border-zinc-100 px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            >
              Clear {label.toLowerCase()} filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}
