import {
  ArrowRight,
  CirclePlus,
  Loader2,
  MessageSquare,
  Pencil,
  RotateCw,
  SendHorizontal,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTaskThread } from '../hooks/useTaskThread'
import { STATUS_LABEL } from '../lib/constants'
import { formatFull, timeAgo } from '../lib/dates'
import type { Activity, Comment } from '../lib/types'

const FIELD_NAMES: Record<string, string> = {
  title: 'title',
  description: 'description',
  priority: 'priority',
  due_date: 'due date',
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

function describe(a: Activity): { icon: ReactNode; text: ReactNode } {
  const strong = (s: ReactNode) => <span className="font-medium text-zinc-700">{s}</span>
  switch (a.action) {
    case 'created':
      return { icon: <CirclePlus className="size-3.5" />, text: <>created this task</> }
    case 'status_changed':
      return {
        icon: <ArrowRight className="size-3.5" />,
        text: (
          <>
            moved from {strong(STATUS_LABEL[a.details.from!] ?? a.details.from)} →{' '}
            {strong(STATUS_LABEL[a.details.to!] ?? a.details.to)}
          </>
        ),
      }
    case 'edited':
      return {
        icon: <Pencil className="size-3.5" />,
        text: <>edited the {joinWords((a.details.fields ?? []).map((f) => FIELD_NAMES[f] ?? f))}</>,
      }
    case 'assigned':
      return { icon: <UserPlus className="size-3.5" />, text: <>assigned {strong(a.details.member ?? 'a member')}</> }
    case 'unassigned':
      return {
        icon: <UserMinus className="size-3.5" />,
        text: <>unassigned {strong(a.details.member ?? 'a member')}</>,
      }
    default:
      return { icon: <Pencil className="size-3.5" />, text: <>updated this task</> }
  }
}

type FeedItem = { kind: 'activity'; item: Activity } | { kind: 'comment'; item: Comment }

/** Comments and change history for a task, merged into one chronological timeline. */
export function TaskThread({ taskId, refreshKey }: { taskId: string; refreshKey: string }) {
  const { comments, activity, state, retry, addComment, deleteComment } = useTaskThread(taskId, refreshKey)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const feed = useMemo<FeedItem[]>(
    () =>
      [
        ...activity.map((item) => ({ kind: 'activity' as const, item })),
        ...comments.map((item) => ({ kind: 'comment' as const, item })),
      ].sort((a, b) => a.item.created_at.localeCompare(b.item.created_at)),
    [activity, comments],
  )

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      await addComment(body)
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post comment')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="size-3.5 text-zinc-400" />
        <h3 className="text-[13px] font-medium text-zinc-900">Activity</h3>
        {comments.length > 0 && (
          <span className="text-xs text-zinc-400 tabular-nums">
            · {comments.length} comment{comments.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div>
        {state === 'loading' && (
          <div className="space-y-3 pt-1" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-2">
                <span className="size-5 rounded-full bg-zinc-100" />
                <span className="h-2.5 w-2/3 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            Couldn't load activity.{' '}
            <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-medium underline">
              <RotateCw className="size-3" /> Retry
            </button>
          </div>
        )}

        {state === 'ready' && (
          <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[9px] before:w-px before:bg-zinc-200">
            {feed.map((entry) =>
              entry.kind === 'activity' ? (
                <ActivityRow key={entry.item.id} activity={entry.item} />
              ) : (
                <CommentRow key={entry.item.id} comment={entry.item} onDelete={deleteComment} />
              ),
            )}
          </ol>
        )}
      </div>

      {/* Not a <form>: this lives inside the task dialog's form, and forms can't nest */}
      <div className="mt-4">
        <div className="rounded-lg border border-zinc-200 bg-surface transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void send()
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder="Leave a comment…"
            aria-label="Comment"
            className="block w-full resize-none rounded-lg bg-transparent px-3 pt-2.5 text-[13px] outline-none placeholder:text-zinc-400"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="pl-1 text-[11px] text-zinc-400">⌘↵ to send</span>
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || sending}
              className="inline-flex h-6 items-center gap-1 rounded-md bg-accent px-2 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-40"
            >
              {sending ? <Loader2 className="size-3.5 animate-spin" /> : <SendHorizontal className="size-3.5" />}
              Comment
            </button>
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: Activity }) {
  const { icon, text } = describe(activity)
  return (
    <li className="relative flex items-start gap-2.5 text-xs text-zinc-500">
      <span className="z-10 grid size-5 shrink-0 place-items-center rounded-full bg-surface text-zinc-400 ring-1 ring-zinc-200">
        {icon}
      </span>
      <p className="pt-0.5 leading-relaxed">
        <span className="font-medium text-zinc-700">You</span> {text}
        <span className="text-zinc-400" title={formatFull(activity.created_at)}>
          {' '}
          · {timeAgo(activity.created_at)}
        </span>
      </p>
    </li>
  )
}

function CommentRow({ comment, onDelete }: { comment: Comment; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <li className="group relative flex items-start gap-2.5">
      <span className="z-10 grid size-5 shrink-0 place-items-center rounded-full bg-zinc-700 text-[9px] font-semibold text-surface ring-2 ring-surface">
        Y
      </span>
      <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-surface px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-zinc-800">You</span>
          <span className="text-zinc-400" title={formatFull(comment.created_at)}>
            {timeAgo(comment.created_at)}
          </span>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true)
              try {
                await onDelete(comment.id)
              } catch {
                setDeleting(false)
              }
            }}
            aria-label="Delete comment"
            className="ml-auto text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 focus-visible:opacity-100"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
        <p className="mt-0.5 text-sm break-words whitespace-pre-wrap text-zinc-700">{comment.body}</p>
      </div>
    </li>
  )
}
