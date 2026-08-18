import type { SupabaseClient } from '@supabase/supabase-js'

export interface InviteRequestResult {
  status: string
  invite_token: string
}

export const sendInviteRequest = async (
  client: SupabaseClient,
  nbreadId: string,
  targetUserId: string,
): Promise<InviteRequestResult[]> => {
  const { data, error } = await client
    .from('nbread_invite')
    .select('status, invite_token')
    .eq('nbread_id', nbreadId)
    .eq('target_user_id', targetUserId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const activeInvites =
    data?.filter(
      (invite) => invite.status === 'pending' || invite.status === 'accepted',
    ) ?? []

  if (activeInvites.length > 0) {
    // 처리 중이거나 이미 수락된 초대가 있으면 중복 초대를 생성하지 않는다.
    return activeInvites
  }

  // 최초 초대와 재초대 모두 대상 사용자를 연결한 pending 레코드를 새로 만든다.
  // 거절되거나 만료된 기록은 지우지 않고 보존한다.
  const { data: insertedData, error: insertError } = await client
    .from('nbread_invite')
    .insert([
      {
        nbread_id: nbreadId,
        target_user_id: targetUserId,
        status: 'pending',
      },
    ])
    .select('status, invite_token')

  if (insertError) {
    throw insertError
  }

  return insertedData
}
