drop trigger if exists trigger_init_payment_dates on public.nbread;

alter table public.nbread
rename column current_payment_date to start_date;

alter table public.nbread
rename column next_payment_date to end_date;

update public.nbread
set end_date = end_date - 1
where end_date is not null;

alter table public.nbread_auto_generation_logs
add column if not exists start_date date,
add column if not exists end_date date;

create or replace function public.calculate_nbread_period_start(
  p_today date,
  p_payment_period text,
  p_payment_month integer,
  p_payment_day integer
)
returns date
language plpgsql
immutable
as $$
declare
  candidate_month date;
  target_month date;
  max_day integer;
  candidate_date date;
begin
  if p_payment_period = 'month' then
    candidate_month := date_trunc('month', p_today)::date;
  elsif p_payment_period = 'year' then
    if p_payment_month is null then
      raise exception 'payment_month is required for yearly nbread';
    end if;

    candidate_month := make_date(
      extract(year from p_today)::integer,
      p_payment_month,
      1
    );
  else
    raise exception 'Unsupported payment period: %', p_payment_period;
  end if;

  max_day := extract(
    day from (candidate_month + interval '1 month - 1 day')
  )::integer;

  candidate_date := candidate_month + (least(p_payment_day, max_day) - 1);

  if candidate_date <= p_today then
    return candidate_date;
  end if;

  if p_payment_period = 'month' then
    target_month := candidate_month - interval '1 month';
  else
    target_month := candidate_month - interval '1 year';
  end if;

  max_day := extract(
    day from (target_month + interval '1 month - 1 day')
  )::integer;

  return target_month + (least(p_payment_day, max_day) - 1);
end;
$$;

create or replace function public.init_payment_dates()
returns trigger
language plpgsql
as $$
declare
  period_start date;
  next_period_start date;
begin
  period_start := public.calculate_nbread_period_start(
    current_date,
    new.payment_period,
    new.payment_month,
    new.payment_date
  );

  next_period_start := public.calculate_next_nbread_payment_date(
    period_start,
    new.payment_period,
    new.payment_month,
    new.payment_date
  );

  new.start_date := period_start;
  new.end_date := next_period_start - 1;

  return new;
end;
$$;

create trigger trigger_init_payment_dates
before insert or update of payment_period, payment_month, payment_date
on public.nbread
for each row
execute function public.init_payment_dates();

create or replace function public.generate_nbread_records_for_due_group(
  p_nbread_id uuid,
  p_today date default current_date
)
returns jsonb
language plpgsql
as $$
declare
  target_nbread public.nbread%rowtype;
  new_start_date date;
  new_end_date date;
  next_start_date date;
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

  if target_nbread.start_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'start_date_is_null',
      'nbread_id', p_nbread_id
    );
  end if;

  if target_nbread.end_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'end_date_is_null',
      'nbread_id', p_nbread_id,
      'start_date', target_nbread.start_date
    );
  end if;

  if target_nbread.end_date >= p_today then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'period_not_ended',
      'nbread_id', target_nbread.id,
      'start_date', target_nbread.start_date,
      'end_date', target_nbread.end_date
    );
  end if;

  new_start_date := target_nbread.end_date + 1;
  next_start_date := public.calculate_next_nbread_payment_date(
    new_start_date,
    target_nbread.payment_period,
    target_nbread.payment_month,
    target_nbread.payment_date
  );
  new_end_date := next_start_date - 1;

  select count(*)
  into existing_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = new_start_date;

  if existing_count > 0 then
    update public.nbread
    set start_date = new_start_date,
        end_date = new_end_date
    where id = target_nbread.id;

    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'records_already_exist',
      'nbread_id', target_nbread.id,
      'start_date', new_start_date,
      'end_date', new_end_date,
      'payment_date', new_start_date,
      'existing_count', existing_count
    );
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select participant.nbread_id, participant.user_id, new_start_date, false
  from public.participant
  where participant.nbread_id = target_nbread.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  update public.nbread
  set start_date = new_start_date,
      end_date = new_end_date
  where id = target_nbread.id;

  return jsonb_build_object(
    'status', 'success',
    'reason', 'records_created',
    'nbread_id', target_nbread.id,
    'start_date', new_start_date,
    'end_date', new_end_date,
    'payment_date', new_start_date,
    'inserted_count', inserted_count
  );
end;
$$;
