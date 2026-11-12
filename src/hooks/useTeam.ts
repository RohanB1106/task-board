import { useCallback, useEffect, useState } from 'react'
import { STARTER_LABELS } from '../lib/colors'
import { supabase } from '../lib/supabase'
import type { Label, TeamMember } from '../lib/types'

/** Team members and labels for the guest's workspace. */
export function useTeam(userId: string) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('team_members').select('id, name, color, created_at').order('created_at'),
      supabase.from('labels').select('id, name, color, created_at').order('created_at'),
    ]).then(([m, l]) => {
      if (cancelled) return
      if (m.error || l.error) {
        setError((m.error ?? l.error)!.message)
        return
      }
      setMembers(m.data as TeamMember[])
      setLabels(l.data as Label[])
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const createMember = useCallback(
    async (name: string, color: string) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ name, color, user_id: userId })
        .select('id, name, color, created_at')
        .single()
      if (error) throw new Error(error.message)
      setMembers((prev) => [...prev, data as TeamMember])
    },
    [userId],
  )

  const deleteMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const createLabel = useCallback(
    async (name: string, color: string) => {
      const { data, error } = await supabase
        .from('labels')
        .insert({ name, color, user_id: userId })
        .select('id, name, color, created_at')
        .single()
      if (error) throw new Error(error.message)
      setLabels((prev) => [...prev, data as Label])
    },
    [userId],
  )

  const deleteLabel = useCallback(async (id: string) => {
    const { error } = await supabase.from('labels').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const addStarterLabels = useCallback(async () => {
    const { data, error } = await supabase
      .from('labels')
      .insert(STARTER_LABELS.map((l) => ({ ...l, user_id: userId })))
      .select('id, name, color, created_at')
    if (error) throw new Error(error.message)
    setLabels((prev) => [...prev, ...(data as Label[])])
  }, [userId])

  return { members, labels, error, createMember, deleteMember, createLabel, deleteLabel, addStarterLabels }
}
