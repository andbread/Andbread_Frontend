drop trigger if exists trigger_init_payment_dates on public.nbread;

create trigger trigger_init_payment_dates
before insert or update of payment_period, payment_month, payment_date
on public.nbread
for each row
execute function public.init_payment_dates();
