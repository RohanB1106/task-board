import { CalendarDays, Check, ChevronDown, ChevronRight, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { COLUMNS, PRIORITIES } from '../lib/constants'
import { formatFull } from '../lib/dates'
import {
  taskKey,
  type Label,
  type Priority,
  type Status,
  type Task,
  type TaskInput,
  type TaskLinks,
  type TeamMember,
} from '../lib/types'
import { Avatar } from './Avatar'
import { PriorityIcon, StatusIcon } from './icons'
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
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const ids = useId()

  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, suspended])

  const busy = saving || deleting
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    if (busy) return
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

  const titleField = (
    <textarea
      id={`${ids}-title`}
      ref={titleRef}
      autoFocus={!existing}
      value={title}
      onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        // The title is single-line; Enter saves
        if (e.key === 'Enter') {
          e.preventDefault()
          void handleSubmit()
        }
      }}
      rows={1}
      maxLength={200}
      placeholder="Task title"
      aria-label="Title"
      className="block w-full resize-none bg-transparent text-xl leading-snug font-semibold text-zinc-900 outline-none [field-sizing:content] placeholder:text-zinc-400"
    />
  )

  const descriptionField = (
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Add description…"
      aria-label="Description"
      rows={existing ? 4 : 3}
      className="mt-2 block min-h-16 w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-700 outline-none [field-sizing:content] placeholder:text-zinc-400"
    />
  )

  const statusSelect = (
    <SelectControl
      label="Status"
      icon={<StatusIcon status={status} />}
      value={status}
      onChange={(v) => setStatus(v as Status)}
      options={COLUMNS.map((c) => ({ value: c.id, label: c.title }))}
    />
  )
  const prioritySelect = (
    <SelectControl
      label="Priority"
      icon={<PriorityIcon priority={priority} />}
      value={priority}
      onChange={(v) => setPriority(v as Priority)}
      options={PRIORITIES.map((p) => ({ value: p.id, label: p.label }))}
    />
  )
  const dueInput = (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-zinc-500" />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date"
        className={`${controlClass} pr-2 pl-7 ${dueDate ? '' : 'text-zinc-400'}`}
      />
    </div>
  )

  const assigneeChips = (
    <ChipGroup emptyText="No teammates yet" onManage={onManageTeam} isEmpty={members.length === 0}>
      {members.map((m) => (
        <ToggleChip
          key={m.id}
          selected={assigneeIds.includes(m.id)}
          onToggle={() => setAssigneeIds((p) => toggle(p, m.id))}
        >
          <Avatar member={m} size="xs" />
          {m.name}
        </ToggleChip>
      ))}
    </ChipGroup>
  )
  const labelChips = (
    <ChipGroup emptyText="No labels yet" onManage={onManageTeam} isEmpty={labels.length === 0}>
      {labels.map((l) => (
        <ToggleChip key={l.id} selected={labelIds.includes(l.id)} onToggle={() => setLabelIds((p) => toggle(p, l.id))}>
          <span className="grid size-4 place-items-center">
            <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
          </span>
          {l.name}
        </ToggleChip>
      ))}
    </ChipGroup>
  )

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={existing ? `Task ${taskKey(existing) ?? ''} ${existing.title}` : 'New task'}
        onSubmit={handleSubmit}
        className={`animate-dialog-in flex w-full flex-col overflow-hidden rounded-t-xl border border-zinc-200 bg-surface shadow-2xl shadow-black/25 sm:rounded-xl ${
          existing ? 'h-[92dvh] max-w-5xl sm:h-[min(760px,88dvh)]' : 'max-h-[92dvh] max-w-2xl'
        }`}
      >
        {/* Breadcrumb header */}
        <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-zinc-200 px-4 text-[13px]">
          <StatusIcon status={status} />
          <span className="shrink-0 text-zinc-500">{existing ? (taskKey(existing) ?? 'Task') : 'Board'}</span>
          <ChevronRight className="size-3.5 shrink-0 text-zinc-400" />
          <span className="truncate font-medium text-zinc-800">{existing ? existing.title : 'New task'}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {existing ? (
          <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
            <div className="scroll-thin min-w-0 px-5 py-6 sm:px-8 md:flex-1 md:overflow-y-auto">
              {titleField}
              {descriptionField}
              <div className="mt-6 border-t border-zinc-200 pt-5">
                <TaskThread taskId={existing.id} refreshKey={`${existing.updated_at}|${existing.assignee_ids.join()}`} />
              </div>
            </div>
            <aside
              aria-label="Properties"
              className="scroll-thin order-first shrink-0 border-b border-zinc-200 bg-panel px-4 py-4 md:order-none md:w-72 md:overflow-y-auto md:border-b-0 md:border-l"
            >
              <h3 className="mb-3 text-[11px] font-medium text-zinc-500">Properties</h3>
              <dl className="space-y-1.5">
                <PropertyRow label="Status">{statusSelect}</PropertyRow>
                <PropertyRow label="Priority">{prioritySelect}</PropertyRow>
                <PropertyRow label="Due date">{dueInput}</PropertyRow>
              </dl>
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="mb-2 text-[11px] font-medium text-zinc-500">Assignees</h3>
                  {assigneeChips}
                </div>
                <div>
                  <h3 className="mb-2 text-[11px] font-medium text-zinc-500">Labels</h3>
                  {labelChips}
                </div>
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-zinc-400">
                Created {formatFull(existing.created_at)}
                <br />
                Updated {formatFull(existing.updated_at)}
              </p>
            </aside>
          </div>
        ) : (
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
            {titleField}
            {descriptionField}
            <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {statusSelect}
              {prioritySelect}
              {dueInput}
            </div>
            <div className="mt-4 grid gap-x-3 gap-y-2 sm:grid-cols-[72px_1fr] sm:items-start">
              <span className="pt-1 text-xs text-zinc-500">Assignees</span>
              {assigneeChips}
              <span className="pt-1 text-xs text-zinc-500">Labels</span>
              {labelChips}
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mx-4 mb-2 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex h-12 shrink-0 items-center gap-2 border-t border-zinc-200 px-4">
          {existing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              onBlur={() => !deleting && setConfirmDelete(false)}
              disabled={busy}
              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition disabled:opacity-50 ${
                confirmDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'text-zinc-500 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {confirmDelete ? 'Click again to delete' : 'Delete'}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-7 rounded-md px-2.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-white shadow-xs transition hover:bg-accent-hover disabled:opacity-60"
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

const controlClass =
  'h-8 w-full rounded-md border border-zinc-200 bg-surface text-[13px] text-zinc-800 outline-none transition hover:border-zinc-300 focus:border-accent focus:ring-2 focus:ring-accent/20'

function SelectControl({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2 flex -translate-y-1/2">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`${controlClass} appearance-none pr-7 pl-7`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-zinc-400" />
    </div>
  )
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ChipGroup({
  emptyText,
  onManage,
  isEmpty,
  children,
}: {
  emptyText: string
  onManage: () => void
  isEmpty: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {isEmpty && <span className="py-1 pr-1 text-xs text-zinc-400">{emptyText}</span>}
      {children}
      <button
        type="button"
        onClick={onManage}
        title="Manage team and labels"
        className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-zinc-300 px-1.5 text-xs text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800"
      >
        <Plus className="size-3" />
        {isEmpty ? 'Add' : 'Edit'}
      </button>
    </div>
  )
}

function ToggleChip({ selected, onToggle, children }: { selected: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex h-6 items-center gap-1.5 rounded-md border pr-2 pl-1 text-xs font-medium transition ${
        selected
          ? 'border-accent/40 bg-accent-soft text-accent-fg'
          : 'border-zinc-200 bg-surface text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
      }`}
    >
      {children}
      {selected && <Check className="size-3" strokeWidth={2.5} />}
    </button>
  )
}
