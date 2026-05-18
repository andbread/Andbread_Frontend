create or replace function public.create_initial_nbread_records()
returns trigger
language plpgsql
as $$
declare
  period_start date;
begin
  select n.start_date
  into period_start
  from public.nbread n
  where n.id = new.nbread_id;

  if period_start is null then
    return new;
  end if;

  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  values (new.nbread_id, new.user_id, period_start, false)
  on conflict (nbread_id, payment_date, user_id) do nothing;

  return new;
end;
$$;
