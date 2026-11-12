import { createContext, useContext } from 'react'
import type { Label, TeamMember } from './types'

export interface WorkspaceLookup {
  membersById: Map<string, TeamMember>
  labelsById: Map<string, Label>
}

export const WorkspaceContext = createContext<WorkspaceLookup>({
  membersById: new Map(),
  labelsById: new Map(),
})

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

/** Resolve ids to records, skipping any that were deleted. */
export function pick<T>(ids: string[], byId: Map<string, T>): T[] {
  return ids.map((id) => byId.get(id)).filter((x): x is T => x !== undefined)
}
