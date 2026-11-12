import { initials } from '../lib/colors'
import type { Label, TeamMember } from '../lib/types'

const SIZES = {
  xs: 'size-5 text-[9px]',
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
}

export function Avatar({
  member,
  size = 'sm',
  ring = false,
}: {
  member: Pick<TeamMember, 'name' | 'color'>
  size?: keyof typeof SIZES
  ring?: boolean
}) {
  return (
    <span
      title={member.name}
      style={{ backgroundColor: member.color }}
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-tight text-white select-none ${SIZES[size]} ${
        ring ? 'ring-2 ring-white' : ''
      }`}
    >
      {initials(member.name)}
    </span>
  )
}

/** Overlapping avatars, collapsing extras into "+N". */
export function AvatarStack({
  members,
  max = 3,
  size = 'xs',
}: {
  members: TeamMember[]
  max?: number
  size?: keyof typeof SIZES
}) {
  if (members.length === 0) return null
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <span className="flex -space-x-1.5" aria-label={`Assigned to ${members.map((m) => m.name).join(', ')}`}>
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className={`inline-grid place-items-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ring-2 ring-white ${SIZES[size]}`}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

export function LabelChip({ label, className = '' }: { label: Pick<Label, 'name' | 'color'>; className?: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-white px-1.5 py-px text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 ring-inset ${className}`}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
      <span className="truncate">{label.name}</span>
    </span>
  )
}
