create or replace function public.sync_nbread_records_on_payment_schedule_change()
returns trigger
language plpgsql
as $$
begin
  if new.start_date is null or new.start_date is not distinct from old.start_date then
    return new;
  end if;

  -- Preserve previous periods and create the newly calculated current period
  -- for every participant. Any unexpected insert error rolls back the UPDATE.
  insert into public.nbread_records (nbread_id, user_id, payment_date, is_paid)
  select p.nbread_id, p.user_id, new.start_date, false
  from public.participant p
  where p.nbread_id = new.id
  on conflict (nbread_id, payment_date, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trigger_sync_nbread_records_on_payment_schedule_change
on public.nbread;

create trigger trigger_sync_nbread_records_on_payment_schedule_change
after update of payment_period, payment_month, payment_date
on public.nbread
for each row
when (
  old.payment_period is distinct from new.payment_period
  or old.payment_month is distinct from new.payment_month
  or old.payment_date is distinct from new.payment_date
)
execute function public.sync_nbread_records_on_payment_schedule_change();
