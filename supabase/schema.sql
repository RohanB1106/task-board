-- =====================================================================
-- Task Board — Supabase schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- Every table has Row Level Security on; each guest only sees own rows.
-- =====================================================================

-- ---------- Tasks ----------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(trim(title)) > 0),
  description text,
  status      text not null default 'todo'
              check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'normal'
              check (priority in ('low', 'normal', 'high')),
  due_date    date,
  position    double precision not null default 0,  -- order within a column
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status, position);

-- ---------- Team members --------------------------------------------
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) > 0),
  color      text not null default '#6366f1',
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Many-to-many: a task can have several assignees
create table if not exists public.task_assignees (
  task_id   uuid not null references public.tasks (id) on delete cascade,
  member_id uuid not null references public.team_members (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (task_id, member_id)
);

-- ---------- Labels ---------------------------------------------------
create table if not exists public.labels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) > 0),
  color      text not null default '#64748b',
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.task_labels (
  task_id  uuid not null references public.tasks (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (task_id, label_id)
);

-- ---------- Comments -------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  body       text not null check (char_length(trim(body)) > 0),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists comments_task_idx on public.comments (task_id, created_at);

-- ---------- Activity log (written by triggers, read-only to clients) --
create table if not exists public.task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  action     text not null,          -- created | status_changed | edited | assigned | unassigned
  details    jsonb not null default '{}'::jsonb,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists activity_task_idx on public.task_activity (task_id, created_at);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.tasks          enable row level security;
alter table public.team_members   enable row level security;
alter table public.task_assignees enable row level security;
alter table public.labels         enable row level security;
alter table public.task_labels    enable row level security;
alter table public.comments       enable row level security;
alter table public.task_activity  enable row level security;

-- Owner-only CRUD on the user-editable tables
do $$
declare t text;
begin
  foreach t in array array['tasks','team_members','task_assignees','labels','task_labels','comments']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Join rows / comments may only point at records the user owns.
-- Restrictive policies are AND-ed with "own rows" above.
do $$
declare
  rule record;
begin
  for rule in
    select * from (values
      ('task_assignees',
       'exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
        and exists (select 1 from public.team_members m where m.id = member_id and m.user_id = auth.uid())'),
      ('task_labels',
       'exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
        and exists (select 1 from public.labels l where l.id = label_id and l.user_id = auth.uid())'),
      ('comments',
       'exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())')
    ) as v(tbl, cond)
  loop
    execute format('drop policy if exists "linked insert" on public.%I', rule.tbl);
    execute format('create policy "linked insert" on public.%I as restrictive for insert to authenticated with check (%s)', rule.tbl, rule.cond);
    execute format('drop policy if exists "linked update" on public.%I', rule.tbl);
    execute format('create policy "linked update" on public.%I as restrictive for update to authenticated using (true) with check (%s)', rule.tbl, rule.cond);
  end loop;
end $$;

-- Activity: clients can read their own history but never write it directly
drop policy if exists "read own activity" on public.task_activity;
create policy "read own activity" on public.task_activity for select to authenticated
  using (user_id = auth.uid());

-- =====================================================================
-- Triggers
-- =====================================================================

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Log task creation, status moves and edits
create or replace function public.log_task_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed text[] := '{}';
begin
  if tg_op = 'INSERT' then
    insert into task_activity (task_id, action, details, user_id)
    values (new.id, 'created', jsonb_build_object('status', new.status), new.user_id);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into task_activity (task_id, action, details, user_id)
    values (new.id, 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status), new.user_id);
  end if;

  if new.title       is distinct from old.title       then changed := array_append(changed, 'title'); end if;
  if new.description is distinct from old.description then changed := array_append(changed, 'description'); end if;
  if new.priority    is distinct from old.priority    then changed := array_append(changed, 'priority'); end if;
  if new.due_date    is distinct from old.due_date    then changed := array_append(changed, 'due_date'); end if;

  if array_length(changed, 1) > 0 then
    insert into task_activity (task_id, action, details, user_id)
    values (new.id, 'edited', jsonb_build_object('fields', to_jsonb(changed)), new.user_id);
  end if;
  return new;
end $$;

drop trigger if exists tasks_activity on public.tasks;
create trigger tasks_activity after insert or update on public.tasks
  for each row execute function public.log_task_activity();

-- Log assignment changes
create or replace function public.log_assignee_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; member_name text;
begin
  r := coalesce(new, old);
  -- Skip when the task itself is being deleted (cascade)
  if not exists (select 1 from tasks where id = r.task_id) then return null; end if;
  select name into member_name from team_members where id = r.member_id;
  insert into task_activity (task_id, action, details, user_id)
  values (r.task_id,
          case when tg_op = 'INSERT' then 'assigned' else 'unassigned' end,
          jsonb_build_object('member', member_name), r.user_id);
  return null;
end $$;

drop trigger if exists assignees_activity on public.task_assignees;
create trigger assignees_activity after insert or delete on public.task_assignees
  for each row execute function public.log_assignee_activity();

-- Trigger functions are not meant to be called directly
revoke execute on function public.log_task_activity()     from public, anon, authenticated;
revoke execute on function public.log_assignee_activity() from public, anon, authenticated;
