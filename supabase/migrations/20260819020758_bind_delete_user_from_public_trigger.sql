-- supabase db dump는 auth 스키마의 트리거를 포함하지 않으므로,
-- baseline에 있는 회원 삭제 함수를 auth.users의 DELETE에 다시 연결한다.
-- 운영처럼 다른 이름의 동일 기능 트리거가 있어도 중복 생성하지 않는다.
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and n.nspname = 'public'
      and p.proname = 'delete_user_from_public'
      and not t.tgisinternal
  ) then
    create trigger delete_user_from_public_trigger
      after delete on auth.users
      for each row
      execute function public.delete_user_from_public();
  end if;
end;
$$;
