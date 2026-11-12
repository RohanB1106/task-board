import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { COLUMNS, PRIORITIES } from '../lib/constants'
import { formatFull } from '../lib/dates'
import type { Label, Priority, Status, Task, TaskInput, TaskLinks, TeamMember } from '../lib/types'
import { Avatar } from './Avatar'
import { PriorityIcon } from './TaskCard'
import { TaskThread } from './TaskThread'

export type DialogState = { mode: 'create'; status: Status } | { mode: 'edit'; task: Task }

interface TaskDialogProps {
  state: DialogState
  members: TeamMember[]
  labels: Label[]
  /** True while another dialog is stacked on top (Escape belongs to it). */
  suspended: boolean
  onClose: () => void
  onSave: (input: TaskInput, links: TaskLinks) => Promise<void>
  onDelete?: () => Promise<void>
  onManageTeam: () => void
}

const fieldClass =
  'w-full rounded-lg border border-zinc-200 bg-surface px-3 py-2 text-sm text-zinc-900 shadow-xs outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15'

const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-600'

export function TaskDialog({
  state,
  members,
  labels,
  suspended,
  onClose,
  onSave,
  onDelete,
  onManageTeam,
}: TaskDialogProps) {
  const existing = state.mode === 'edit' ? state.task : null
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [status, setStatus] = useState<Status>(existing?.status ?? (state.mode === 'create' ? state.status : 'todo'))
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'normal')
  const [dueDate, setDueDate] = useState(existing?.due_date ?? '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(existing?.assignee_ids ?? [])
  const [labelIds, setLabelIds] = useState<string[]>(existing?.label_ids ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const ids = useId()

  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, suspended])

  const busy = saving || deleting
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

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
      await onSave(
        { title: trimmed, description: description.trim() || null, status, priority, due_date: dueDate || null },
        {
          // Drop any member / label deleted while the dialog was open
          assignee_ids: assigneeIds.filter((id) => members.some((m) => m.id === id)),
          label_ids: labelIds.filter((id) => labels.some((l) => l.id === id)),
        },
      )
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

  const fields = (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${ids}-title`} className={labelClass}>
          Title
        </label>
        <input
          id={`${ids}-title`}
          ref={titleRef}
          autoFocus={!existing}
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
                priority === p.id ? 'bg-surface text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <input
                type="radio"
                name={`${ids}-priority`}
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

      <PickerField
        legend="Assignees"
        emptyText="No team members yet."
        manageText="Add people"
        onManage={onManageTeam}
        isEmpty={members.length === 0}
      >
        {members.map((m) => (
          <ToggleChip
            key={m.id}
            selected={assigneeIds.includes(m.id)}
            onToggle={() => setAssigneeIds((prev) => toggle(prev, m.id))}
          >
            <Avatar member={m} size="xs" />
            {m.name}
          </ToggleChip>
        ))}
      </PickerField>

      <PickerField
        legend="Labels"
        emptyText="No labels yet."
        manageText="Create labels"
        onManage={onManageTeam}
        isEmpty={labels.length === 0}
      >
        {labels.map((l) => (
          <ToggleChip
            key={l.id}
            selected={labelIds.includes(l.id)}
            onToggle={() => setLabelIds((prev) => toggle(prev, l.id))}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </ToggleChip>
        ))}
      </PickerField>

      {existing && (
        <p className="text-[11px] text-zinc-400">
          Created {formatFull(existing.created_at)} · Updated {formatFull(existing.updated_at)}
        </p>
      )}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-start sm:p-4 sm:pt-[min(8vh,calc(20dvh-1rem))]"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-heading`}
        onSubmit={handleSubmit}
        className={`animate-dialog-in flex max-h-[calc(100dvh-1rem)] w-full flex-col rounded-t-2xl bg-surface shadow-2xl shadow-black/20 ring-1 ring-zinc-200 sm:max-h-[min(86dvh,calc(100dvh-2rem))] sm:rounded-2xl ${
          existing ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h2 id={`${ids}-heading`} className="text-sm font-semibold text-zinc-900">
            {existing ? 'Task details' : 'New task'}
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

        {existing ? (
          // Details on the left, comments + history on the right (stacked on small screens)
          <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:overflow-hidden">
            <div className="px-5 py-4 lg:overflow-y-auto">{fields}</div>
            <div className="flex min-h-0 flex-col border-t border-zinc-100 bg-zinc-50/60 lg:border-t-0 lg:border-l">
              <TaskThread taskId={existing.id} refreshKey={`${existing.updated_at}|${existing.assignee_ids.join()}`} />
            </div>
          </div>
        ) : (
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{fields}</div>
        )}

        {error && (
          <p
            role="alert"
            className="mx-5 my-2 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200"
          >
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

function PickerField({
  legend,
  emptyText,
  manageText,
  onManage,
  isEmpty,
  children,
}: {
  legend: string
  emptyText: string
  manageText: string
  onManage: () => void
  isEmpty: boolean
  children: ReactNode
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {legend} <span className="font-normal text-zinc-400">(optional)</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {isEmpty && <span className="py-1 text-xs text-zinc-400">{emptyText}</span>}
        {children}
        <button
          type="button"
          onClick={onManage}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 ring-dashed transition hover:bg-zinc-50 hover:text-zinc-800"
        >
          <Plus className="size-3" />
          {isEmpty ? manageText : 'Manage'}
        </button>
      </div>
    </fieldset>
  )
}

function ToggleChip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1 text-xs font-medium ring-1 transition ${
        selected
          ? 'bg-indigo-50 text-indigo-800 ring-indigo-300'
          : 'bg-surface text-zinc-600 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
      }`}
    >
      {children}
      {selected && <Check className="size-3 text-indigo-600" strokeWidth={3} />}
    </button>
  )
}
