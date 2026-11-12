import { Loader2, Trash2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { COLUMNS, PRIORITIES } from '../lib/constants'
import type { Priority, Status, Task, TaskInput } from '../lib/types'
import { PriorityIcon } from './TaskCard'

export type DialogState = { mode: 'create'; status: Status } | { mode: 'edit'; task: Task }

interface TaskDialogProps {
  state: DialogState
  onClose: () => void
  onSave: (input: TaskInput) => Promise<void>
  onDelete?: () => Promise<void>
}

const fieldClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15'

const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-600'

export function TaskDialog({ state, onClose, onSave, onDelete }: TaskDialogProps) {
  const existing = state.mode === 'edit' ? state.task : null
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [status, setStatus] = useState<Status>(existing?.status ?? (state.mode === 'create' ? state.status : 'todo'))
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'normal')
  const [dueDate, setDueDate] = useState(existing?.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const ids = useId()

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const busy = saving || deleting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Give the task a title.')
      titleRef.current?.focus()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: trimmed,
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the task.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-950/30 backdrop-blur-[2px] sm:items-start sm:p-4 sm:pt-[min(12vh,calc(20dvh-1rem))]"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-heading`}
        onSubmit={handleSubmit}
        className="animate-dialog-in flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-200 sm:max-h-[min(80dvh,calc(100dvh-2rem))] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h2 id={`${ids}-heading`} className="text-sm font-semibold text-zinc-900">
            {existing ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor={`${ids}-title`} className={labelClass}>
              Title
            </label>
            <input
              id={`${ids}-title`}
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design onboarding flow"
              maxLength={200}
              className={`${fieldClass} text-[15px] font-medium`}
            />
          </div>

          <div>
            <label htmlFor={`${ids}-desc`} className={labelClass}>
              Description <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              id={`${ids}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail…"
              rows={3}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-status`} className={labelClass}>
                Status
              </label>
              <select
                id={`${ids}-status`}
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className={fieldClass}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${ids}-due`} className={labelClass}>
                Due date <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id={`${ids}-due`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Priority</legend>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
              {PRIORITIES.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 ${
                    priority === p.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.id}
                    checked={priority === p.id}
                    onChange={() => setPriority(p.id)}
                    className="sr-only"
                  />
                  <PriorityIcon priority={p.id} className="size-3.5" />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>

        </div>

        {error && (
          <p role="alert" className="mx-5 mb-3 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-100 px-5 py-3">
          {existing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-zinc-500 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {existing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
