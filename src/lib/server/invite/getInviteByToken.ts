import type { SupabaseClient } from '@supabase/supabase-js'

export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface InviteDetails {
  nbreadId: string
  status: InviteStatus
  nbreadTitle: string
  leaderName: string
}

/**
 * 비로그인 상태에서도 열리는 유일한 조회다.
 * 인증이 없으면 anon 클라이언트가 주입된다.
 */
export const getInviteByToken = async (
  client: SupabaseClient,
  inviteToken: string,
): Promise<InviteDetails | null> => {
  // 공개 링크에는 엔빵 ID 대신 초대 토큰만 노출하고 실제 초대 정보를 조회한다.
  const { data: invite, error: inviteError } = await client
    .from('nbread_invite')
    .select('nbread_id, status')
    .eq('invite_token', inviteToken)
    .maybeSingle()

  if (inviteError) throw inviteError
  if (!invite) return null

  const { data: nbread, error: nbreadError } = await client
    .from('nbread')
    .select('title, leader_id')
    .eq('id', invite.nbread_id)
    .single()

  if (nbreadError) throw nbreadError

  const { data: leader, error: leaderError } = await client
    .from('user')
    .select('name')
    .eq('id', nbread.leader_id)
    .single()

  if (leaderError) throw leaderError

  return {
    nbreadId: invite.nbread_id,
    status: invite.status as InviteStatus,
    nbreadTitle: nbread.title,
    leaderName: leader.name,
  }
}
