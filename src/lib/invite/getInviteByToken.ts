import { supabase } from '@/lib/supabaseClient'
import { captureAppError } from '@/lib/sentry/sentry'

export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface InviteDetails {
  nbreadId: string
  status: InviteStatus
  nbreadTitle: string
  leaderName: string
}

export const getInviteByToken = async (
  inviteToken: string,
): Promise<InviteDetails | null> => {
  try {
    // 공개 링크에는 엔빵 ID 대신 초대 토큰만 노출하고 실제 초대 정보를 조회한다.
    const { data: invite, error: inviteError } = await supabase
      .from('nbread_invite')
      .select('nbread_id, status')
      .eq('invite_token', inviteToken)
      .maybeSingle()

    if (inviteError) throw inviteError
    if (!invite) return null

    const { data: nbread, error: nbreadError } = await supabase
      .from('nbread')
      .select('title, leader_id')
      .eq('id', invite.nbread_id)
      .single()

    if (nbreadError) throw nbreadError

    const { data: leader, error: leaderError } = await supabase
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
  } catch (error) {
    captureAppError(error, {
      action: 'invite.get_by_token',
    })
    throw error
  }
}
