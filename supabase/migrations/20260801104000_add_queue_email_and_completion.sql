alter table public.call_queue
  add column email text,
  add constraint call_queue_email_check
    check (email is null or char_length(trim(email)) between 3 and 254);

create or replace function public.complete_queued_call(
  p_queue_id uuid,
  p_called_at timestamptz,
  p_company_name text,
  p_contact_person text,
  p_phone text,
  p_email text,
  p_priority text,
  p_outcome text,
  p_report text,
  p_business_details text
)
returns setof public.calls
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_call public.calls%rowtype;
  removed_queue_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;

  perform 1
  from public.call_queue
  where id = p_queue_id;

  if not found then
    raise exception 'Queue item was not found or is not accessible';
  end if;

  insert into public.calls (
    user_id,
    called_at,
    company_name,
    contact_person,
    phone,
    email,
    priority,
    outcome,
    report,
    business_details
  )
  values (
    (select auth.uid()),
    p_called_at,
    p_company_name,
    p_contact_person,
    p_phone,
    nullif(trim(p_email), ''),
    p_priority,
    p_outcome,
    p_report,
    p_business_details
  )
  returning * into created_call;

  delete from public.call_queue
  where id = p_queue_id
  returning id into removed_queue_id;

  if removed_queue_id is null then
    raise exception 'Queue item could not be removed';
  end if;

  return next created_call;
end;
$$;

revoke all on function public.complete_queued_call(
  uuid,
  timestamptz,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.complete_queued_call(
  uuid,
  timestamptz,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
