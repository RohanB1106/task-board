/** Parse a YYYY-MM-DD string as a local date (not UTC midnight). */
export function parseDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Whole days from today until the date (negative = in the past). */
export function daysUntil(value: string): number {
  return Math.round((parseDay(value).getTime() - startOfToday().getTime()) / 86_400_000)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later' | 'done'

export interface DueInfo {
  label: string
  tone: DueTone
}

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

export function dueInfo(value: string, isDone: boolean): DueInfo {
  const days = daysUntil(value)
  const date = parseDay(value)
  if (isDone) return { label: shortDate.format(date), tone: 'done' }
  if (days < 0) return { label: days === -1 ? 'Yesterday' : `${-days}d overdue`, tone: 'overdue' }
  if (days === 0) return { label: 'Today', tone: 'today' }
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (days <= 6) return { label: weekday.format(date), tone: 'soon' }
  return { label: shortDate.format(date), tone: 'later' }
}

export function isOverdue(value: string | null, isDone: boolean): boolean {
  return Boolean(value) && !isDone && daysUntil(value!) < 0
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** "just now", "5 min ago", "2 hours ago", "yesterday", then a date. */
export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), 'day')
  return shortDate.format(new Date(iso))
}

export function formatFull(iso: string): string {
  return fullDate.format(new Date(iso))
}
