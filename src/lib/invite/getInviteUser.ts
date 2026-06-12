import { supabase } from '../supabaseClient'
import useUserStore from '@/stores/useAuthStore'
export const getInviteUser = async (tag: string, nbreadId: string) => {
  const { user } = useUserStore.getState()
  const currentUserId = user?.id
  try {
    const { data: users, error } = await supabase
      .from('user')
      .select('id,profile_image,name')
      .eq('tag', tag)
      .neq('id', currentUserId)

    if (error) {
      console.error('유저 데이터 요청 실패', error)
      return
    }

    // 2. 각 유저의 invite 상태 확인
    const usersWithInviteStatus = await Promise.all(
      users.map(async (user) => {
        const { data: nbreadData } = await supabase
          .from('nbread_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('nbread_id', nbreadId)
          .maybeSingle()

        const { data: inviteData } = await supabase
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
        const result = {
          ...user,
          status: status,
        }

        return result
      }),
    )
    return usersWithInviteStatus
  } catch (error) {}
}
