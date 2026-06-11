create or replace function public.generate_nbread_records_for_due_group(
  p_nbread_id uuid,
  p_today date default current_date
)
returns jsonb
language plpgsql
as $$
declare
  target_nbread public.nbread%rowtype;
  settlement_payment_date date;
  record_payment_date date;
  next_record_payment_date date;
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

  settlement_payment_date := target_nbread.current_payment_date::date;
  record_payment_date := target_nbread.next_payment_date::date;

  if settlement_payment_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'current_payment_date_is_null',
      'nbread_id', p_nbread_id
    );
  end if;

  if record_payment_date is null then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'next_payment_date_is_null',
      'nbread_id', p_nbread_id,
      'settlement_date', settlement_payment_date
    );
  end if;

  if settlement_payment_date > p_today then
    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'not_due',
      'nbread_id', p_nbread_id,
      'settlement_date', settlement_payment_date,
      'payment_date', record_payment_date
    );
  end if;

  next_record_payment_date := public.calculate_next_nbread_payment_date(
    record_payment_date,
    target_nbread.payment_period,
    target_nbread.payment_month,
    target_nbread.payment_date
  );

  select count(*)
  into existing_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = record_payment_date;

  if existing_count > 0 then
    update public.nbread
    set current_payment_date = record_payment_date,
        next_payment_date = next_record_payment_date
    where id = target_nbread.id;

    return jsonb_build_object(
      'status', 'skipped',
      'reason', 'records_already_exist',
      'nbread_id', target_nbread.id,
      'settlement_date', settlement_payment_date,
      'payment_date', record_payment_date,
      'next_payment_date', next_record_payment_date,
      'existing_count', existing_count
    );
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select participant.nbread_id, participant.user_id, record_payment_date, false
  from public.participant
  where participant.nbread_id = target_nbread.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  update public.nbread
  set current_payment_date = record_payment_date,
      next_payment_date = next_record_payment_date
  where id = target_nbread.id;

  return jsonb_build_object(
    'status', 'success',
    'reason', 'records_created',
    'nbread_id', target_nbread.id,
    'settlement_date', settlement_payment_date,
    'payment_date', record_payment_date,
    'next_payment_date', next_record_payment_date,
    'inserted_count', inserted_count
  );
end;
$$;
