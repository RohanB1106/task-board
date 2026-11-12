import { AlertTriangle, CheckCircle2, KeyRound, Loader2, RotateCw, X } from 'lucide-react'
import type { Toast } from '../hooks/useToasts'

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex items-center gap-2.5 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin text-zinc-400" />
        {label}
      </div>
    </div>
  )
}

export function ErrorPanel({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-accent-hover"
        >
          <RotateCw className="size-3.5" /> Try again
        </button>
      </div>
    </div>
  )
}

export function SetupNotice() {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-surface p-6 shadow-sm">
        <div className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-fg">
          <KeyRound className="size-5" />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-zinc-900">Connect Supabase</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Copy <code className="rounded bg-zinc-100 px-1 text-xs">.env.example</code> to{' '}
          <code className="rounded bg-zinc-100 px-1 text-xs">.env</code>, add your project URL and anon key, then
          restart the dev server.
        </p>
      </div>
    </div>
  )
}

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] text-white ring-1 ring-white/10 shadow-lg shadow-black/20"
        >
          {t.tone === 'error' ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          )}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-neutral-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
