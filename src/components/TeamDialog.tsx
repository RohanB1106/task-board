import { Check, Loader2, Plus, Sparkles, Tag, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { SWATCHES, nextSwatch } from '../lib/colors'
import type { Label, TeamMember } from '../lib/types'
import { Avatar, LabelChip } from './Avatar'

interface TeamDialogProps {
  members: TeamMember[]
  labels: Label[]
  onClose: () => void
  onCreateMember: (name: string, color: string) => Promise<void>
  onDeleteMember: (id: string) => Promise<void>
  onCreateLabel: (name: string, color: string) => Promise<void>
  onDeleteLabel: (id: string) => Promise<void>
  onAddStarterLabels: () => Promise<void>
}

export function TeamDialog(props: TeamDialogProps) {
  const { members, labels, onClose } = props

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/30 backdrop-blur-[2px] sm:items-start sm:p-4 sm:pt-[min(10vh,calc(20dvh-1rem))]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Team and labels"
        className="animate-dialog-in flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-200 sm:max-h-[min(84dvh,calc(100dvh-2rem))] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-900">Team &amp; labels</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="scroll-thin grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 sm:grid-cols-2">
          <Section
            icon={<Users className="size-4" />}
            title="Team members"
            hint="People you can assign tasks to."
            items={members}
            placeholder="e.g. Alex Kim"
            usedColors={members.map((m) => m.color)}
            onCreate={props.onCreateMember}
            onDelete={props.onDeleteMember}
            renderItem={(m) => (
              <>
                <Avatar member={m} size="sm" />
                <span className="truncate text-sm text-zinc-800">{m.name}</span>
              </>
            )}
            empty={<p className="text-xs text-zinc-500">No members yet. Add your teammates to start assigning work.</p>}
          />
          <Section
            icon={<Tag className="size-4" />}
            title="Labels"
            hint="Tag tasks and filter the board."
            items={labels}
            placeholder="e.g. Backend"
            usedColors={labels.map((l) => l.color)}
            onCreate={props.onCreateLabel}
            onDelete={props.onDeleteLabel}
            renderItem={(l) => <LabelChip label={l} className="text-xs" />}
            empty={<StarterLabels onAdd={props.onAddStarterLabels} />}
          />
        </div>
      </div>
    </div>
  )
}

function StarterLabels({ onAdd }: { onAdd: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">No labels yet.</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          try {
            await onAdd()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not add labels')
          } finally {
            setBusy(false)
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        Add starter labels (Bug, Feature, Design, Docs)
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface SectionProps<T extends { id: string; name: string }> {
  icon: ReactNode
  title: string
  hint: string
  items: T[]
  placeholder: string
  usedColors: string[]
  onCreate: (name: string, color: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  renderItem: (item: T) => ReactNode
  empty: ReactNode
}

function Section<T extends { id: string; name: string }>({
  icon,
  title,
  hint,
  items,
  placeholder,
  usedColors,
  onCreate,
  onDelete,
  renderItem,
  empty,
}: SectionProps<T>) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextSwatch(usedColors))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already exists.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onCreate(trimmed, color)
      setName('')
      setColor(nextSwatch([...usedColors, color]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id)
      return
    }
    setDeletingId(id)
    setError(null)
    try {
      await onDelete(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-zinc-900">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-zinc-400 tabular-nums">{items.length}</span>
      </div>
      <p className="-mt-2 mb-3 text-xs text-zinc-500">{hint}</p>

      <form onSubmit={handleSubmit} className="rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-200/70">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            maxLength={40}
            aria-label={`New ${title.toLowerCase()} name`}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`grid size-5 place-items-center rounded-full transition ${
                color === c ? 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-50' : 'hover:scale-110'
              }`}
            >
              {color === c && <Check className="size-3 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <ul className="mt-3 space-y-1">
        {items.length === 0 && <li>{empty}</li>}
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-zinc-50"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">{renderItem(item)}</span>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              onBlur={() => confirmId === item.id && setConfirmId(null)}
              disabled={deletingId === item.id}
              aria-label={`Delete ${item.name}`}
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition ${
                confirmId === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
              }`}
            >
              {deletingId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {confirmId === item.id && 'Delete?'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
