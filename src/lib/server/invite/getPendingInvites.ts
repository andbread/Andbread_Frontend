import type { SupabaseClient } from '@supabase/supabase-js'

export interface PendingInvite {
  id: string
  inviteToken: string
  nbreadId: string
  nbreadTitle: string
  leaderName: string
  createdAt: string
}

export const getPendingInvites = async (
  client: SupabaseClient,
  userId: string,
): Promise<PendingInvite[]> => {
  const { data: invites, error: inviteError } = await client
    .from('nbread_invite')
    .select('id, invite_token, nbread_id, created_at')
    .eq('target_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (inviteError) throw inviteError
  if (!invites || invites.length === 0) return []

  const nbreadIds = [...new Set(invites.map((invite) => invite.nbread_id))]
  const { data: nbreads, error: nbreadError } = await client
    .from('nbread')
    .select('id, title, leader_id')
    .in('id', nbreadIds)

  if (nbreadError) throw nbreadError
  if (!nbreads || nbreads.length === 0) return []

  const leaderIds = [...new Set(nbreads.map((nbread) => nbread.leader_id))]
  const { data: leaders, error: leaderError } = await client
    .from('user')
    .select('id, name')
    .in('id', leaderIds)

  if (leaderError) throw leaderError

  const nbreadMap = new Map(nbreads.map((nbread) => [nbread.id, nbread]))
  const leaderMap = new Map(
    (leaders ?? []).map((leader) => [leader.id, leader.name]),
  )

  // 홈 배너와 목록 페이지가 동일한 pending 초대 기준을 사용한다.
  return invites.flatMap((invite) => {
    const nbread = nbreadMap.get(invite.nbread_id)
    if (!nbread) return []

    return [
      {
        id: invite.id,
        inviteToken: invite.invite_token,
        nbreadId: invite.nbread_id,
        nbreadTitle: nbread.title,
        leaderName: leaderMap.get(nbread.leader_id) ?? '알 수 없는 사용자',
        createdAt: invite.created_at,
      },
    ]
  })
}
