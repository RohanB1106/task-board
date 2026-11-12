import { useCallback, useEffect, useState } from 'react'
import { Board, BoardSkeleton } from './components/Board'
import { Header } from './components/Header'
import { ErrorPanel, FullScreenLoader, SetupNotice, Toaster } from './components/StatusScreens'
import { TaskDialog, type DialogState } from './components/TaskDialog'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { useToasts } from './hooks/useToasts'
import { isConfigured } from './lib/supabase'
import type { Status, Task } from './lib/types'

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

function Workspace({ userId }: { userId: string }) {
  const { tasks, loadState, loadError, reload, createTask, updateTask, deleteTask } = useTasks(userId)
  const { toasts, notify, dismiss } = useToasts()
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const openCreate = useCallback((status: Status = 'todo') => setDialog({ mode: 'create', status }), [])
  const openEdit = useCallback((task: Task) => setDialog({ mode: 'edit', task }), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  // "N" opens the new-task dialog (ignored while typing or when a dialog is open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'n') return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      openCreate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, openCreate])

  const handleMove = useCallback(
    (id: string, status: Status, position: number) => {
      updateTask(id, { status, position }).catch((err: Error) =>
        notify(`Couldn't move the task: ${err.message}`),
      )
    },
    [updateTask, notify],
  )

  return (
    <div className="flex h-full flex-col">
      <Header tasks={tasks} userId={userId} onNewTask={() => openCreate()} />

      <main className="min-h-0 flex-1">
        {loadState === 'loading' && <BoardSkeleton />}
        {loadState === 'error' && (
          <ErrorPanel title="Couldn't load your tasks" message={loadError ?? 'Unknown error'} onRetry={reload} />
        )}
        {loadState === 'ready' && <Board tasks={tasks} onMove={handleMove} onAdd={openCreate} onOpen={openEdit} />}
      </main>

      {dialog && (
        <TaskDialog
          key={dialog.mode === 'edit' ? dialog.task.id : `new-${dialog.status}`}
          state={dialog}
          onClose={closeDialog}
          onSave={async (input) => {
            if (dialog.mode === 'edit') {
              await updateTask(dialog.task.id, input)
            } else {
              await createTask(input)
              notify('Task created', 'success')
            }
          }}
          onDelete={
            dialog.mode === 'edit'
              ? async () => {
                  await deleteTask(dialog.task.id)
                  notify('Task deleted', 'success')
                }
              : undefined
          }
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
