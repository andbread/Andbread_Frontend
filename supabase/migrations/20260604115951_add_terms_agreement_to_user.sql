alter table public.user
  add column if not exists terms_agreed boolean not null default false,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_agreed boolean not null default false,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists privacy_version text;

create or replace function public.insert_into_public_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- 카카오 로그인 처리
    if new.raw_app_meta_data->>'provider' = 'kakao' then
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
        values (
            new.raw_user_meta_data->>'email',
            coalesce(
                new.raw_user_meta_data->>'name',
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'email',
                '사용자'
            ),
            new.raw_user_meta_data->>'avatar_url',
            'kakao',
            new.id,
            floor(random() * 9000 + 1000),
            false,
            false
        );
    -- 구글 로그인 처리
    elsif new.raw_app_meta_data->>'provider' = 'google' then
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
        values (
            new.raw_user_meta_data->>'email',
            coalesce(
                new.raw_user_meta_data->>'name',
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'email',
                '사용자'
            ),
            new.raw_user_meta_data->>'avatar_url',
            'google',
            new.id,
            floor(random() * 9000 + 1000),
            false,
            false
        );
    end if;

    return new;
end;
$$;
