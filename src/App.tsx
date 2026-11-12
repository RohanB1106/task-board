import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board, BoardSkeleton } from './components/Board'
import { ErrorPanel, FullScreenLoader, SetupNotice, Toaster } from './components/StatusScreens'
import { TaskDialog, type DialogState } from './components/TaskDialog'
import { TeamDialog } from './components/TeamDialog'
import { FilterBar } from './components/FilterBar'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { useTeam } from './hooks/useTeam'
import { useToasts } from './hooks/useToasts'
import { EMPTY_FILTERS, hasActiveFilters, matchesFilters, type Filters } from './lib/filters'
import { isConfigured } from './lib/supabase'
import type { Status, Task } from './lib/types'
import { WorkspaceContext } from './lib/workspace'

export default function App() {
  if (!isConfigured) return <SetupNotice />
  return <GuestGate />
}

function GuestGate() {
  const session = useGuestSession()
  if (session.status === 'loading') return <FullScreenLoader label="Setting up your workspace…" />
  if (session.status === 'error')
    return <ErrorPanel title="Couldn't start a guest session" message={session.message} onRetry={session.retry} />
  return <Workspace userId={session.userId} />
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function Workspace({ userId }: { userId: string }) {
  const board = useTasks(userId)
  const team = useTeam(userId)
  const { toasts, notify, dismiss } = useToasts()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const { tasks } = board
  const visibleTasks = useMemo(() => tasks.filter((t) => matchesFilters(t, filters)), [tasks, filters])
  const lookup = useMemo(
    () => ({
      membersById: new Map(team.members.map((m) => [m.id, m])),
      labelsById: new Map(team.labels.map((l) => [l.id, l])),
    }),
    [team.members, team.labels],
  )

  // The edit dialog always shows the latest copy of its task
  const liveDialog: DialogState | null = useMemo(() => {
    if (dialog?.mode !== 'edit') return dialog
    const task = tasks.find((t) => t.id === dialog.task.id)
    return task ? { mode: 'edit', task } : null
  }, [dialog, tasks])

  useEffect(() => {
    if (team.error) notify(`Couldn't load team and labels: ${team.error}`)
  }, [team.error, notify])

  const openCreate = useCallback((status: Status = 'todo') => setDialog({ mode: 'create', status }), [])
  const openEdit = useCallback((task: Task) => setDialog({ mode: 'edit', task }), [])
  const closeDialog = useCallback(() => setDialog(null), [])
  const closeTeam = useCallback(() => setTeamOpen(false), [])

  // Keyboard shortcuts: N = new task, / = search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || teamOpen || menuOpen || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openCreate()
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, teamOpen, menuOpen, openCreate])

  const handleMove = useCallback(
    (id: string, status: Status, position: number) => {
      board.updateTask(id, { status, position }).catch((err: Error) => notify(`Couldn't move the task: ${err.message}`))
    },
    [board, notify],
  )

  const filtering = hasActiveFilters(filters)

  return (
    <WorkspaceContext.Provider value={lookup}>
      <div className="flex h-full">
        <Sidebar
          userId={userId}
          tasks={tasks}
          members={team.members}
          labels={team.labels}
          filters={filters}
          onToggleAssignee={(id) => setFilters((f) => ({ ...f, assignees: toggleId(f.assignees, id) }))}
          onToggleLabel={(id) => setFilters((f) => ({ ...f, labels: toggleId(f.labels, id) }))}
          onManageTeam={() => {
            setMenuOpen(false)
            setTeamOpen(true)
          }}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        {/* Main panel: inset with a border on large screens, like Linear */}
        <div className="flex min-w-0 flex-1 flex-col bg-panel lg:my-2 lg:mr-2 lg:overflow-hidden lg:rounded-lg lg:border lg:border-zinc-200 lg:shadow-xs">
          <TopBar
            ref={searchRef}
            search={filters.search}
            onSearch={(search) => setFilters((f) => ({ ...f, search }))}
            onNewTask={() => openCreate()}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <FilterBar
            filters={filters}
            onChange={setFilters}
            members={team.members}
            labels={team.labels}
            shown={visibleTasks.length}
            total={tasks.length}
          />

          <main className="min-h-0 flex-1">
            {board.loadState === 'loading' && <BoardSkeleton />}
            {board.loadState === 'error' && (
              <ErrorPanel
                title="Couldn't load your tasks"
                message={board.loadError ?? 'Unknown error'}
                onRetry={board.reload}
              />
            )}
            {board.loadState === 'ready' && (
              <Board
                tasks={visibleTasks}
                filtering={filtering}
                onMove={handleMove}
                onAdd={openCreate}
                onOpen={openEdit}
              />
            )}
          </main>
        </div>

        {liveDialog && (
          <TaskDialog
            key={liveDialog.mode === 'edit' ? liveDialog.task.id : `new-${liveDialog.status}`}
            state={liveDialog}
            members={team.members}
            labels={team.labels}
            suspended={teamOpen}
            onClose={closeDialog}
            onManageTeam={() => setTeamOpen(true)}
            onSave={async (input, links) => {
              if (liveDialog.mode === 'edit') {
                await board.updateTask(liveDialog.task.id, input)
                await board.setLinks(liveDialog.task.id, links)
              } else {
                await board.createTask(input, links)
                notify('Task created', 'success')
              }
            }}
            onDelete={
              liveDialog.mode === 'edit'
                ? async () => {
                    await board.deleteTask(liveDialog.task.id)
                    notify('Task deleted', 'success')
                  }
                : undefined
            }
          />
        )}

        {teamOpen && (
          <TeamDialog
            members={team.members}
            labels={team.labels}
            onClose={closeTeam}
            onCreateMember={team.createMember}
            onDeleteMember={async (id) => {
              await team.deleteMember(id)
              board.forgetMember(id)
              setFilters((f) => ({ ...f, assignees: f.assignees.filter((x) => x !== id) }))
            }}
            onCreateLabel={team.createLabel}
            onDeleteLabel={async (id) => {
              await team.deleteLabel(id)
              board.forgetLabel(id)
              setFilters((f) => ({ ...f, labels: f.labels.filter((x) => x !== id) }))
            }}
            onAddStarterLabels={team.addStarterLabels}
          />
        )}

        <Toaster toasts={toasts} onDismiss={dismiss} />
      </div>
    </WorkspaceContext.Provider>
  )
}
