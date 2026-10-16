-- NOTE: 이 job이 정상 동작하려면 환경별로 vault secret 2개가 먼저 등록돼 있어야 함
--   select vault.create_secret('<프로젝트 URL>', 'project_url');
--   select vault.create_secret('<cron 시크릿 값>', 'nbread_auto_generate_cron_secret');
-- 시크릿 값 자체는 환경마다 달라야 하므로 이 마이그레이션에 포함하지 않음.

select
  cron.schedule(
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
