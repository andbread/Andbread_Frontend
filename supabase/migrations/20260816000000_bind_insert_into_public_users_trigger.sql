-- insert_into_public_users() 함수는 baseline에 있었지만, 이를 auth.users에 실제로
-- 연결하는 트리거는 어떤 마이그레이션 파일에도 없었다. `supabase db dump`가 auth 스키마를
-- 기본적으로 제외하기 때문에, 운영에 이미 있던(이름을 알 수 없는) 트리거가 이번 baseline
-- 통합 과정에서 캡처되지 못했다. 운영은 기존 트리거가 살아있어 정상 동작했지만, 개발
-- 프로젝트는 baseline만 적용해서 트리거 자체가 없어 카카오/구글 로그인 후 public.user에
-- 행이 생기지 않는 문제가 있었다.
--
-- insert_into_public_users()를 호출하는 트리거가 auth.users에 하나도 없을 때만 새로 만든다.
-- 운영에 이미 다른 이름의 동일 기능 트리거가 있을 수 있으므로, 무조건 생성하면 신규 가입마다
-- public.user에 두 번 insert가 시도되어 PK 충돌로 가입 자체가 깨질 수 있기 때문이다.

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and p.proname = 'insert_into_public_users'
      and not t.tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.insert_into_public_users();
  end if;
end;
$$;
