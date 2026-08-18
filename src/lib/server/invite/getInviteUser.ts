import type { SupabaseClient } from '@supabase/supabase-js'

export interface InviteCandidate {
  id: string
  profile_image: string | null
  name: string
  status: string
}

/**
 * 기존 lib은 useUserStore에서 현재 사용자를 꺼냈다.
 * 서버에는 스토어가 없으므로 토큰에서 얻은 currentUserId를 받는다.
 *
 * 응답 키를 profile_image 그대로 두는 이유는 호출부가 그 이름을 쓰기 때문이다.
 */
export const getInviteUser = async (
  client: SupabaseClient,
  tag: string,
  nbreadId: string,
  currentUserId: string,
): Promise<InviteCandidate[] | null> => {
  const { data: users, error } = await client
    .from('user')
    .select('id,profile_image,name')
    .eq('tag', tag)
    .neq('id', currentUserId)

  if (error) {
    console.error('유저 데이터 요청 실패', error)
    return null
  }

  // 2. 각 유저의 invite 상태 확인
  return Promise.all(
    users.map(async (user) => {
      const { data: nbreadData } = await client
        .from('nbread_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('nbread_id', nbreadId)
        .maybeSingle()

      const { data: inviteData } = await client
        .from('nbread_invite')
        .select('status')
        .eq('target_user_id', user.id)
        .eq('nbread_id', nbreadId)
        // 재초대 기록이 여러 개면 가장 최근 초대 상태를 사용한다.
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let status = '초대 하기'
      if (nbreadData === 'accept') {
        status = '참여 중'
      } else if (inviteData?.status == 'pending') {
        status = '초대 완료'
      } else if (inviteData?.status == 'rejected') {
        status = '초대 하기'
      }

      return {
        ...user,
        status,
      }
    }),
  )
}
