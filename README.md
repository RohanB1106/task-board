# Taskboard

**Live demo:** https://task-board-five-beta.vercel.app

A Kanban-style task board built with React, TypeScript and Supabase. Each visitor
gets a private guest workspace through Supabase anonymous sign-in, and Row Level
Security makes sure guests only ever see their own tasks.

## Features

**Core**
- **Board:** four columns (To Do, In Progress, In Review, Done), with drag and drop
  between and within columns using mouse, touch or keyboard
- **Tasks:** title, description, priority (low / normal / high) and due date; create,
  edit and delete
- **Guest accounts:** a guest session is created automatically on first visit
  and reused after that
- **Persistence:** every change saves to Supabase straight away; moves are
  optimistic and roll back with a notice if the save fails
- **States:** loading placeholders, empty-column hints, error screens with retry,
  and pop-up notifications

**Advanced**
- **Team members and assignees:** add teammates (name + colour), assign one or
  more to a task, and see avatar stacks on cards
- **Labels:** create custom labels (or one-click starter labels), tag tasks with
  several labels, and filter the board by them
- **Comments:** comments are listed in time order on the task detail panel,
  stored in a `comments` table
- **Activity log:** database triggers record creates, column moves, field edits
  and assignment changes, shown as a timeline (e.g. "moved from To Do → In
  Progress · 2 hours ago")
- **Due-date indicators:** overdue (red), due today / soon (amber), later (neutral)
- **Search and filters:** search by title or description, and filter by priority,
  assignee (including "Unassigned") and label, with an "X of Y" count
- **Board stats:** total, done and overdue counts in the header
- **Dark mode:** follows the system by default, with a toggle (system / light / dark)
  that's remembered per browser
- **Responsive:** columns snap-scroll on phones, and dialogs become bottom sheets
- **Keyboard:** `N` new task, `/` search, `Esc` to close; cards can be moved with
  the keyboard

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, Inter, lucide icons |
| Drag and drop | dnd-kit |
| Backend | Supabase (Postgres, Auth, RLS); no custom server |
| Hosting | Vercel |

## Run locally

Requirements: Node.js 20+ and a free Supabase project.

1. **Database:** in Supabase, open SQL Editor → New query, paste
   [`supabase/schema.sql`](supabase/schema.sql) and run it.
2. **Guest auth:** in Authentication → Sign In / Providers, turn on
   **Allow anonymous sign-ins**.
3. **Environment:** copy the example file and fill in the values from
   Project Settings → API:
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable / anon key>
   ```
4. **Start:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173.

## Security

- Row Level Security is enabled on every table. Policies restrict each row to
  `auth.uid() = user_id`.
- Restrictive policies stop a guest from linking their rows to another guest's
  tasks, labels or team members.
- Clients can read the activity log but can't write to it; only `security definer`
  triggers insert into it.
- The frontend only uses the public anon / publishable key. `.env` is git-ignored,
  and the service-role key is never used.

## Project structure

```
src/
  App.tsx                 session gate, workspace layout, filters, shortcuts
  components/
    Board.tsx             DnD context, column grouping, drop → position logic
    Column.tsx            droppable column with sortable list + empty state
    TaskCard.tsx          card UI (labels, due badge, avatars) + sortable wrapper
    TaskDialog.tsx        create / edit panel with assignee + label pickers
    TaskThread.tsx        merged comments + activity timeline
    TeamDialog.tsx        manage team members and labels
    Toolbar.tsx           search + filter menus
    FilterMenu.tsx, Avatar.tsx, Header.tsx, StatusScreens.tsx
  hooks/
    useGuestSession.ts    anonymous sign-in (StrictMode-safe)
    useTasks.ts           tasks + join-table links, optimistic mutations
    useTeam.ts            members + labels
    useTaskThread.ts      comments + activity for one task
    useToasts.ts
  lib/                    supabase client, types, filters, colours, dates
supabase/
  schema.sql              full schema, RLS policies and triggers
```

### Ordering

Each task stores a floating-point `position`. On drop, the moved task gets the
midpoint between its new neighbours, so a reorder writes exactly one row.
