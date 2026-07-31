create table public.workspace_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.workspace_members enable row level security;

revoke all on table public.workspace_members from anon, authenticated;
grant select on table public.workspace_members to authenticated;

create policy "Members can verify their own workspace access"
on public.workspace_members for select
to authenticated
using (user_id = (select auth.uid()));

-- Bootstrap the accounts that existed when the shared workspace was created.
insert into public.workspace_members (user_id)
select id from auth.users
on conflict (user_id) do nothing;

drop policy if exists "Users can view their own calls" on public.calls;
drop policy if exists "Users can insert their own calls" on public.calls;
drop policy if exists "Users can update their own calls" on public.calls;
drop policy if exists "Users can delete their own calls" on public.calls;

create policy "Workspace members can view calls"
on public.calls for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

create policy "Workspace members can create calls"
on public.calls for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

create policy "Workspace members can update calls"
on public.calls for update
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

create policy "Workspace members can delete calls"
on public.calls for delete
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where user_id = (select auth.uid())
  )
);

revoke all on table public.calls from anon, authenticated;
grant select, insert, delete on table public.calls to authenticated;
grant update (
  called_at,
  company_name,
  contact_person,
  phone,
  email,
  priority,
  outcome,
  report,
  business_details
) on table public.calls to authenticated;
