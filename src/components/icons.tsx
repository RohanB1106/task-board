import type { Priority, Status } from '../lib/types'

/** Status colours, also used by column headers. */
const STATUS_COLOR: Record<Status, string> = {
  todo: '#9b9ba4',
  in_progress: '#e2a03f',
  in_review: '#4cb782',
  done: 'var(--color-accent)',
}

/**
 * Progress-circle status icons: empty → half → three-quarters → checked.
 * Drawn as SVG so they stay crisp at 14px and match in both themes.
 */
export function StatusIcon({ status, size = 14, className = '' }: { status: Status; size?: number; className?: string }) {
  const color = STATUS_COLOR[status]
  const label = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' }[status]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      role="img"
      aria-label={label}
      className={`shrink-0 ${className}`}
      style={{ color }}
    >
      {status === 'done' ? (
        <>
          <circle cx="7" cy="7" r="6.25" fill="currentColor" />
          <path d="M4.3 7.2l1.8 1.8 3.6-3.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {status === 'in_progress' && <path d="M7 7V3.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />}
          {status === 'in_review' && <path d="M7 7V3.5a3.5 3.5 0 1 1-3.5 3.5z" fill="currentColor" />}
        </>
      )}
    </svg>
  )
}

/** Three signal bars; filled count shows priority. */
export function PriorityIcon({ priority, size = 14, className = '' }: { priority: Priority; size?: number; className?: string }) {
  const filled = { low: 1, normal: 2, high: 3 }[priority]
  const label = { low: 'Low priority', normal: 'Normal priority', high: 'High priority' }[priority]
  const bars = [
    { x: 1.5, h: 4 },
    { x: 5.5, h: 7 },
    { x: 9.5, h: 10 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={label} className={`shrink-0 text-zinc-600 ${className}`}>
      {bars.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={12 - b.h}
          width="3"
          height={b.h}
          rx="0.75"
          fill="currentColor"
          opacity={i < filled ? 1 : 0.22}
        />
      ))}
    </svg>
  )
}

/** Small monochrome mark used in the sidebar. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-zinc-900" />
      <circle cx="16" cy="16" r="8.5" fill="none" strokeWidth="2.4" className="stroke-app" />
      <path d="M16 7.5a8.5 8.5 0 0 1 0 17z" className="fill-app" />
    </svg>
  )
}
