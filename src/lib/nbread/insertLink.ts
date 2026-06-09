import { captureAppError } from '@/lib/sentry/sentry'
import { supabase } from '@/lib/supabaseClient'

export const createLinkInvite = async (nbreadId: string) => {
  // 링크 초대도 공유 전에 대상 사용자 없는 초대 레코드를 생성한다.
  const { data, error } = await supabase
    .from('nbread_invite')
    .insert({
      nbread_id: nbreadId,
      target_user_id: null,
      status: 'pending',
    })
    .select('invite_token')
    .single()

  if (error) {
    captureAppError(error, {
      action: 'invite.create_link',
      tags: { nbreadId },
    })
    throw error
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    window.location.origin

  return `${baseUrl}/invite/${data.invite_token}`
}
