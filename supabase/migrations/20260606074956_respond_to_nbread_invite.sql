create or replace function public.respond_to_nbread_invite(
  p_invite_token text,
  p_response text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_invite public.nbread_invite%rowtype;
begin
  if p_response not in ('accepted', 'rejected') then
    raise exception 'INVALID_INVITE_RESPONSE';
  end if;

  -- 동일 초대에 대한 동시 응답을 직렬화해 중복 참여와 상태 덮어쓰기를 막는다.
  select *
    into v_invite
    from public.nbread_invite
   where invite_token = p_invite_token
   for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'INVITE_NOT_PENDING';
  end if;

  if auth.uid() is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if v_invite.target_user_id is null then
    raise exception 'LINK_INVITE_USER_NOT_CONNECTED';
  end if;

  if auth.uid() <> v_invite.target_user_id then
    raise exception 'INVITE_TARGET_MISMATCH';
  end if;

  if p_response = 'accepted' then
    -- 참여자 생성과 초대 상태 변경을 하나의 트랜잭션에서 처리한다.
    insert into public.participant (nbread_id, user_id, is_leader)
    values (v_invite.nbread_id, v_invite.target_user_id, false);
  end if;

  update public.nbread_invite
     set status = p_response
   where id = v_invite.id;

  return jsonb_build_object(
    'invite_id', v_invite.id,
    'nbread_id', v_invite.nbread_id,
    'status', p_response
  );
end;
$$;

comment on function public.respond_to_nbread_invite(text, text) is
  '토큰 초대의 수락 또는 거절을 검증하고 참여자 생성과 상태 변경을 원자적으로 처리';

revoke execute on function public.respond_to_nbread_invite(text, text)
  from public, anon;
grant execute on function public.respond_to_nbread_invite(text, text)
  to authenticated;
