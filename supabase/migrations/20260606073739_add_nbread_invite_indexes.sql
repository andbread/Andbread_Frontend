create index nbread_invite_nbread_target_user_idx
  on public.nbread_invite (nbread_id, target_user_id)
  where target_user_id is not null;

create index nbread_invite_target_user_status_idx
  on public.nbread_invite (target_user_id, status)
  where target_user_id is not null;
