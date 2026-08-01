create table public.call_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  phone text not null,
  note text not null,
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  constraint call_queue_company_name_check
    check (char_length(trim(company_name)) between 1 and 120),
  constraint call_queue_phone_check
    check (char_length(trim(phone)) between 1 and 40),
  constraint call_queue_note_check
    check (char_length(trim(note)) between 1 and 500),
  constraint call_queue_priority_check
    check (priority in ('low', 'medium', 'high'))
);

create index call_queue_created_at_idx
  on public.call_queue (created_at asc);

alter table public.call_queue enable row level security;

revoke all on table public.call_queue from anon, authenticated;
grant select, insert, delete on table public.call_queue to authenticated;

create policy "Workspace members can view the call queue"
on public.call_queue for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

create policy "Workspace members can add to the call queue"
on public.call_queue for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

create policy "Workspace members can remove from the call queue"
on public.call_queue for delete
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);
