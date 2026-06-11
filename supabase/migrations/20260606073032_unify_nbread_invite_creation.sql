alter table public.nbread_invite
  rename column invited_user_id to target_user_id;

alter table public.nbread_invite
  rename column state to status;

alter table public.nbread_invite
  alter column target_user_id drop not null,
  alter column status set default 'pending',
  alter column status set not null,
  add column invite_token text not null default gen_random_uuid()::text;

alter table public.nbread_invite
  add constraint nbread_invite_status_check
    check (status in ('pending', 'accepted', 'rejected', 'expired')),
  add constraint nbread_invite_invite_token_key unique (invite_token);

comment on column public.nbread_invite.target_user_id is
  '친구 초대 대상 사용자 ID. 링크 초대는 수락 전까지 null';

comment on column public.nbread_invite.invite_token is
  '친구 초대와 링크 초대가 공통으로 사용하는 공개 초대 토큰';
