create or replace function public.enforce_nbread_invite_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- pending 초대만 수락, 거절, 기간 만료 중 하나의 종료 상태로 변경할 수 있다.
  if old.status = 'pending'
     and new.status in ('accepted', 'rejected', 'expired') then
    return new;
  end if;

  raise exception 'INVALID_INVITE_STATUS_TRANSITION';
end;
$$;

comment on function public.enforce_nbread_invite_status_transition() is
  '초대 상태를 pending에서 accepted, rejected, expired로만 전환하도록 제한';

revoke execute on function public.enforce_nbread_invite_status_transition()
  from public, anon, authenticated;

create trigger enforce_nbread_invite_status_transition
before update of status on public.nbread_invite
for each row
execute function public.enforce_nbread_invite_status_transition();
