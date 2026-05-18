create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.nbread_auto_generation_logs (
  id bigserial primary key,
  nbread_id uuid references public.nbread(id) on delete set null,
  status text not null check (status in ('success', 'skipped', 'error')),
  reason text,
  payment_date date,
  next_payment_date date,
  inserted_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.nbread_auto_generation_logs enable row level security;

with duplicate_groups as (
  select
    nbread_id,
    payment_date,
    user_id,
    min(id) as keep_id,
    bool_or(is_paid) as merged_is_paid,
    min(created_at) as first_created_at
  from public.nbread_records
  group by nbread_id, payment_date, user_id
  having count(*) > 1
),
merged_records as (
  update public.nbread_records records
  set is_paid = duplicate_groups.merged_is_paid,
      created_at = duplicate_groups.first_created_at
  from duplicate_groups
  where records.id = duplicate_groups.keep_id
  returning records.id
)
delete from public.nbread_records records
using duplicate_groups
where records.nbread_id = duplicate_groups.nbread_id
  and records.payment_date = duplicate_groups.payment_date
  and records.user_id = duplicate_groups.user_id
  and records.id <> duplicate_groups.keep_id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nbread_records_nbread_id_payment_date_user_id_key'
      and conrelid = 'public.nbread_records'::regclass
  ) then
    alter table public.nbread_records
      add constraint nbread_records_nbread_id_payment_date_user_id_key
      unique (nbread_id, payment_date, user_id);
  end if;
end $$;

create or replace function public.calculate_next_nbread_payment_date(
  p_payment_date date,
  p_payment_period text,
  p_payment_month integer,
  p_payment_day integer
)
returns date
language plpgsql
immutable
as $$
declare
  target_month date;
  max_day integer;
begin
  if p_payment_date is null then
    return null;
  end if;

  if p_payment_day is null or p_payment_day < 1 or p_payment_day > 31 then
    raise exception 'Invalid payment day: %', p_payment_day;
  end if;

  if p_payment_period = 'month' then
    target_month := (date_trunc('month', p_payment_date)::date + interval '1 month')::date;
  elsif p_payment_period = 'year' then
    target_month := make_date(
      extract(year from p_payment_date)::integer + 1,
      coalesce(nullif(p_payment_month, 0), extract(month from p_payment_date)::integer),
      1
    );
  else
    raise exception 'Unsupported payment period: %', p_payment_period;
  end if;

  max_day := extract(
    day from (target_month + interval '1 month - 1 day')
  )::integer;

  return target_month + (least(p_payment_day, max_day) - 1);
end;
$$;

create or replace function public.generate_nbread_records_for_due_group(
  p_nbread_id uuid,
  p_today date default current_date
)
returns jsonb
language plpgsql
as $$
declare
  target_nbread public.nbread%rowtype;
  due_payment_date date;
  next_due_payment_date date;
  existing_count integer;
  inserted_count integer;
begin
  select *
  into target_nbread
  from public.nbread
  where id = p_nbread_id
  for update;

  if not found then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'nbread_not_found',
      'nbread_id', p_nbread_id
    );
  end if;

  due_payment_date := target_nbread.next_payment_date::date;

  if due_payment_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'next_payment_date_is_null',
      'nbread_id', p_nbread_id
    );
  end if;

  if due_payment_date > p_today then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'not_due',
      'nbread_id', p_nbread_id,
      'payment_date', due_payment_date
    );
  end if;

  next_due_payment_date := public.calculate_next_nbread_payment_date(
    due_payment_date,
    target_nbread.payment_period,
    target_nbread.payment_month,
    target_nbread.payment_date
  );

  select count(*)
  into existing_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = due_payment_date;

  if existing_count > 0 then
    update public.nbread
    set current_payment_date = due_payment_date,
        next_payment_date = next_due_payment_date
    where id = target_nbread.id;

    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'records_already_exist',
      'nbread_id', target_nbread.id,
      'payment_date', due_payment_date,
      'next_payment_date', next_due_payment_date,
      'existing_count', existing_count
    );
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select participant.nbread_id, participant.user_id, due_payment_date, false
  from public.participant
  where participant.nbread_id = target_nbread.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  update public.nbread
  set current_payment_date = due_payment_date,
      next_payment_date = next_due_payment_date
  where id = target_nbread.id;

  return jsonb_build_object(
    'status', 'success',
    'reason', 'records_created',
    'nbread_id', target_nbread.id,
    'payment_date', due_payment_date,
    'next_payment_date', next_due_payment_date,
    'inserted_count', inserted_count
  );
end;
$$;
