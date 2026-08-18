-- 예외: andbread-dev 프로젝트는 Dashboard의 Database Webhook 기능이
-- "schema supabase_functions does not exist" 오류로 아예 동작하지 않는다
-- (Supabase 호스팅 프로젝트에서도 발생하는 알려진 플랫폼 프로비저닝 문제).
-- 그래서 원칙(환경별 웹훅 설정은 Dashboard 관리)의 예외로, pg_net을 직접 써서
-- 동일한 역할을 하는 트리거를 만든다. 이 파일은 이 dev 프로젝트에만 적용하고
-- 운영에는 절대 push하지 않는다 — 운영엔 이미 Dashboard 웹훅 6개가 있어서
-- 같은 테이블/이벤트에 중복 트리거가 걸리게 된다.
--
-- 사전 조건 (Vault 시크릿, 이미 등록돼 있어야 함):
--   select vault.create_secret('<프로젝트 URL>', 'project_url');
--   select vault.create_secret('<이 환경 service_role 키>', 'nbread_webhook_service_role_key');
--
-- vault secret이 없거나 net.http_post 호출이 실패해도 원본 INSERT/UPDATE
-- 트랜잭션은 절대 실패하지 않도록 방어적으로 작성했다.

create or replace function public.notify_edge_function()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_token text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'project_url';

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'nbread_webhook_service_role_key';

  if v_url is null or v_token is null then
    raise warning 'notify_edge_function(%): project_url 또는 nbread_webhook_service_role_key vault secret이 없어 호출을 건너뜀', TG_ARGV[0];
    return new;
  end if;

  begin
    perform net.http_post(
      url := v_url || '/functions/v1/' || TG_ARGV[0],
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_token
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(new),
        'old_record', case when TG_OP = 'UPDATE' then to_jsonb(old) else null end
      )
    );
  exception when others then
    raise warning 'notify_edge_function(%) 호출 실패: %', TG_ARGV[0], sqlerrm;
  end;

  return new;
end;
$$;

create or replace trigger trg_chat_notification
after insert on public.chat_messages
for each row execute function public.notify_edge_function('chat-notification');

create or replace trigger trg_friend_request_notification
after insert on public.friend_request
for each row execute function public.notify_edge_function('friend-request-notification');

create or replace trigger trg_friend_response_notification
after update on public.friend_request
for each row execute function public.notify_edge_function('friend-response-notification');

create or replace trigger trg_nbread_invite_notification
after insert on public.nbread_invite
for each row execute function public.notify_edge_function('nbread-invite-notification');

create or replace trigger trg_nbread_invite_accept_notification
after update on public.nbread_invite
for each row execute function public.notify_edge_function('nbread-invite-accept-notification');

create or replace trigger trg_payment_notification
after update on public.nbread_records
for each row execute function public.notify_edge_function('payment-notification');
