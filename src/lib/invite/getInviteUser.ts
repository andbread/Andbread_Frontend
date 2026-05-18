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

          console.log('nbreadData',nbreadData)
        const { data: inviteData } = await supabase
          .from('nbread_invite')
          .select('state')
          .eq('invited_user_id', user.id)
          .eq('nbread_id', nbreadId)
          .maybeSingle() // 없으면 null 반환
          console.log('검색한 유저 데이터 :' ,inviteData)
        let status = '초대 하기'
        if(nbreadData === 'accept') {
            status = '참여 중'
        }
        else if(inviteData?.state == 'pending') {
            status = '초대 완료'
        }
        else if(inviteData?.state == 'reject') {
          status = '초대 하기'
        }
        const result = {
          ...user,
          status: status
        }

        console.log('유저 + 초대 상태:', result) // 여기서 확인
        return result
      }),
    )
    console.log('usersWithInviteStatus', usersWithInviteStatus)
    return usersWithInviteStatus
  } catch (error) {}
}
