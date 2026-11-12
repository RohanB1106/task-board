-- Short per-guest task IDs (TB-1, TB-2, ...), like Linear issue keys.
-- Run once in Supabase → SQL Editor (paste into an EMPTY query, then Run).

alter table public.tasks add column if not exists number integer;

-- Number existing tasks in creation order, per guest
with numbered as (
  select id, row_number() over (partition by user_id order by created_at) as n
  from public.tasks
)
update public.tasks t set number = numbered.n
from numbered
where t.id = numbered.id and t.number is null;

-- New tasks get the next number for that guest. Always assigned by the
-- database, so clients can't choose their own.
create or replace function public.assign_task_number() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Serialise inserts per guest so two tabs can't grab the same number
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  select coalesce(max(number), 0) + 1 into new.number from tasks where user_id = new.user_id;
  return new;
end $$;

drop trigger if exists tasks_number on public.tasks;
create trigger tasks_number before insert on public.tasks
  for each row execute function public.assign_task_number();

revoke execute on function public.assign_task_number() from public, anon, authenticated;

create unique index if not exists tasks_user_number_idx on public.tasks (user_id, number);
