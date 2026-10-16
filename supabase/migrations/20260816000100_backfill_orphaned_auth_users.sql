-- 트리거가 없던 동안 로그인을 시도해서 auth.users엔 있지만 public.user엔 없는 계정을
-- 백필한다. public.user에 이미 있는 id는 건드리지 않아 여러 환경에 반복 적용해도 안전하다.

insert into public.user (
  email,
  name,
  profile_image,
  social_type,
  id,
  tag,
  terms_agreed,
  privacy_agreed
)
select
  u.raw_user_meta_data->>'email',
  coalesce(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'email',
    '사용자'
  ),
  u.raw_user_meta_data->>'avatar_url',
  u.raw_app_meta_data->>'provider',
  u.id,
  floor(random() * 9000 + 1000),
  false,
  false
from auth.users u
where u.raw_app_meta_data->>'provider' in ('kakao', 'google')
  and not exists (
    select 1 from public.user pu where pu.id = u.id
  );
