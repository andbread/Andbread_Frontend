-- Run this once in the Supabase SQL Editor after deploying the Edge Function.
-- Replace the placeholders before executing.

create extension if not exists supabase_vault with schema vault;

select vault.create_secret(
  'https://<PROJECT_REF>.supabase.co',
  'project_url'
);

select vault.create_secret(
  '<CRON_SECRET>',
  'nbread_auto_generate_cron_secret'
);

select cron.unschedule('auto-generate-nbread-records')
where exists (
  select 1
  from cron.job
  where jobname = 'auto-generate-nbread-records'
);

select cron.schedule(
  'auto-generate-nbread-records',
  '0 15 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/auto-generate-nbread-records',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'nbread_auto_generate_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
