import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * invite_token만 돌려준다.
 * 초대 URL 조립은 origin을 아는 클라이언트 lib에 남긴다.
 */
export const createLinkInvite = async (
  client: SupabaseClient,
  nbreadId: string,
): Promise<string> => {
  // 링크 초대도 공유 전에 대상 사용자 없는 초대 레코드를 생성한다.
  const { data, error } = await client
    .from('nbread_invite')
    .insert({
      nbread_id: nbreadId,
      target_user_id: null,
      status: 'pending',
    })
    .select('invite_token')
    .single()

  if (error) {
    console.error('Error creating link invite:', error)
    throw error
  }

  return data.invite_token
}
