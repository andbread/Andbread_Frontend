create or replace function public.respond_to_nbread_invite(
  p_invite_token text,
  p_response text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.nbread_invite%rowtype;
  v_user_id uuid := auth.uid();
  v_participant_limit integer;
  v_participant_count bigint;
  v_participant_inserted boolean := false;
  v_already_participant boolean := false;
begin
  if p_response not in ('accepted', 'rejected') then
    raise exception 'INVALID_INVITE_RESPONSE';
  end if;

  -- 동일 초대에 대한 동시 응답을 직렬화해 상태 변경을 한 번만 처리한다.
  select *
    into v_invite
    from public.nbread_invite
   where invite_token = p_invite_token
   for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.status = 'accepted' then
    raise exception 'INVITE_ALREADY_ACCEPTED';
  elsif v_invite.status = 'rejected' then
    raise exception 'INVITE_ALREADY_REJECTED';
  elsif v_invite.status = 'expired' then
    raise exception 'INVITE_EXPIRED';
  end if;

  if v_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if v_invite.target_user_id is not null
     and v_user_id <> v_invite.target_user_id then
    raise exception 'INVITE_TARGET_MISMATCH';
  end if;

  if p_response = 'accepted' then
    if v_invite.target_user_id is null then
      -- 링크 초대는 수락 시점의 로그인 사용자를 초대 대상자로 연결한다.
      update public.nbread_invite
         set target_user_id = v_user_id
       where id = v_invite.id;

      v_invite.target_user_id := v_user_id;
    end if;

    select exists (
      select 1
        from public.participant
       where nbread_id = v_invite.nbread_id
         and user_id = v_invite.target_user_id
    )
      into v_already_participant;

    if not v_already_participant then
      -- 서로 다른 초대를 동시에 수락해도 정원 확인과 참여자 생성을 직렬화한다.
      select participant_count
        into v_participant_limit
        from public.nbread
       where id = v_invite.nbread_id
       for update;

      if not found then
        raise exception 'NBREAD_NOT_FOUND';
      end if;

      select count(*)
        into v_participant_count
        from public.participant
       where nbread_id = v_invite.nbread_id;

      if v_participant_count >= v_participant_limit then
        raise exception 'INVITE_EXPIRED';
      end if;

      -- 함수 내부 검증을 통과한 초대 응답만 참여자로 등록한다.
      insert into public.participant (nbread_id, user_id, is_leader)
      values (v_invite.nbread_id, v_invite.target_user_id, false)
      on conflict (nbread_id, user_id) do nothing;

      v_participant_inserted := found;
    end if;
  end if;

  update public.nbread_invite
     set status = p_response
   where id = v_invite.id;

  return jsonb_build_object(
    'invite_id', v_invite.id,
    'nbread_id', v_invite.nbread_id,
    'status', p_response,
    'outcome',
      case
        when p_response = 'rejected' then 'rejected'
        when v_participant_inserted then 'joined'
        else 'already_participant'
      end
  );
end;
$$;

comment on function public.respond_to_nbread_invite(text, text) is
  '초대 상태와 대상을 검증하고 RLS로 보호된 참여자 생성을 제한적으로 처리';

revoke execute on function public.respond_to_nbread_invite(text, text)
  from public, anon;
grant execute on function public.respond_to_nbread_invite(text, text)
  to authenticated;
