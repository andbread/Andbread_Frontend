import { supabase } from '../supabaseClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const sendInviteRequest = async (
  nbreadId: string,
  targetUserId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('nbread_invite')
      .select('status, invite_token')
      .eq('nbread_id', nbreadId)
      .eq('target_user_id', targetUserId)

    if (error) {
      captureAppError(error, {
        action: 'invite.select',
        tags: { nbreadId, targetUserId },
      })
      throw error
    }

    if (!data || data.length === 0) {
      // 친구 초대는 대상 사용자를 연결한 pending 초대 레코드를 먼저 생성한다.
      const { data: insertedData, error } = await supabase
        .from('nbread_invite')
        .insert([
          {
            nbread_id: nbreadId,
            target_user_id: targetUserId,
            status: 'pending',
          },
        ])
        .select('status, invite_token')

      if (error) {
        captureAppError(error, {
          action: 'invite.insert',
          tags: { nbreadId, targetUserId },
        })
        throw error
      }

      return insertedData
    }

    if (data.some((item) => item.status === 'rejected')) {
      // 거절된 친구 초대는 새 토큰을 발급해 다시 pending 상태로 전환한다.
      const { data: updatedData, error } = await supabase
        .from('nbread_invite')
        .update({
          status: 'pending',
          invite_token: crypto.randomUUID(),
        })
        .eq('nbread_id', nbreadId)
        .eq('target_user_id', targetUserId)
        .eq('status', 'rejected')
        .select('status, invite_token')

      if (error) {
        captureAppError(error, {
          action: 'invite.update_pending',
          tags: { nbreadId, targetUserId },
        })
        throw error
      }

      return updatedData
    }

    // pending 또는 accepted 초대가 있으면 중복 레코드를 만들지 않는다.
    return data
  } catch (error) {
    console.error('초대 요청 중 오류 발생:', error)
    captureAppError(error, {
      action: 'invite.send_request',
      tags: { nbreadId, targetUserId },
    })
  }
}
