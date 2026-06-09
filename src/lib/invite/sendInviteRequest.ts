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
      .order('created_at', { ascending: false })

    if (error) {
      captureAppError(error, {
        action: 'invite.select',
        tags: { nbreadId, targetUserId },
      })
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

    if (!data || data.length === 0) {
      // 최초 친구 초대는 대상 사용자를 연결한 pending 레코드를 생성한다.
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

    // 거절되거나 만료된 초대는 기록을 보존하고 새 pending 초대를 생성한다.
    const { data: insertedData, error: insertError } = await supabase
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
      captureAppError(insertError, {
        action: 'invite.reinvite',
        tags: { nbreadId, targetUserId },
      })
      throw insertError
    }

    return insertedData
  } catch (error) {
    console.error('초대 요청 중 오류 발생:', error)
    captureAppError(error, {
      action: 'invite.send_request',
      tags: { nbreadId, targetUserId },
    })
  }
}
