alter table public.calls rename column "dateTime" to called_at;
alter table public.calls rename column company to company_name;
alter table public.calls rename column contact to contact_person;
alter table public.calls rename column title to report;
alter table public.calls rename column notes to business_details;

alter table public.calls
  add column user_id uuid not null references auth.users(id) on delete cascade,
  add column email text,
  add column created_at timestamptz not null default now();

alter table public.calls alter column called_at set default now();

alter table public.calls
  add constraint calls_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  add constraint calls_outcome_check
    check (outcome in ('interested', 'not-quite-interested', 'not-interested'));

create index calls_user_called_at_idx
  on public.calls (user_id, called_at desc);

drop policy if exists "Authenticated users have full access" on public.calls;

create policy "Users can view their own calls"
on public.calls for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own calls"
on public.calls for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own calls"
on public.calls for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own calls"
on public.calls for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;
