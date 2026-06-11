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
  participant_count integer;
  final_record_count integer;
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

  select count(*)
  into participant_count
  from public.participant
  where nbread_id = target_nbread.id;

  -- 일부 참여자의 레코드가 이미 있어도 전체 생성을 중단하지 않는다.
  -- 유니크 제약과 ON CONFLICT를 이용해 기존 행은 유지하고 누락된 참여자만 보충한다.
  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select participant.nbread_id, participant.user_id, new_start_date, false
  from public.participant
  where participant.nbread_id = target_nbread.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  select count(*)
  into final_record_count
  from public.nbread_records
  where nbread_id = target_nbread.id
    and payment_date = new_start_date;

  update public.nbread
  set start_date = new_start_date,
      end_date = new_end_date
  where id = target_nbread.id;

  return jsonb_build_object(
    'status', 'success',
    'reason',
      case
        when existing_count > 0 and inserted_count > 0 then 'missing_records_created'
        when existing_count > 0 then 'records_already_complete'
        else 'records_created'
      end,
    'nbread_id', target_nbread.id,
    'start_date', new_start_date,
    'end_date', new_end_date,
    'payment_date', new_start_date,
    'participant_count', participant_count,
    'existing_count', existing_count,
    'inserted_count', inserted_count,
    'final_record_count', final_record_count
  );
end;
$$;
