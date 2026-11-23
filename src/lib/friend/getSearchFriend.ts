import { apiRequest } from '@/lib/apiClient'
import { supabase } from '../supabaseClient'
import type {
  FriendListItem,
  SearchFriendItem,
} from '@/lib/server/friend/getSearchFriend'

export type { FriendListItem }

export const getSearchFriend = async (tag: string, senderId: string) => {
  try {
    return await apiRequest<SearchFriendItem[]>('/api/users/search', {
      query: { tag },
    })
  } catch (error) {
    // 실패 시 빈 배열을 돌려주던 기존 동작을 유지한다.
    console.error(error)
    return []
  }
}

export const getFriendList = async (
  user: string | null,
  nbreadId: string | null,
): Promise<FriendListItem[]> => {
  if (!user) return []

  try {
    return await apiRequest<FriendListItem[]>('/api/friends', {
      query: { nbreadId },
    })
  } catch (error) {
    // 실패 시 빈 배열을 돌려주던 기존 동작을 유지한다.
    console.error(error)
    return []
  }
}

/**
 * 저장소 전체에서 호출부가 없어 엔드포인트로 노출하지 않았다.
 * 제거는 미사용 코드 정리 후속 이슈에서 함께 다룬다.
 */
export const getInviteFriendList = async (
  userId: string,
  inviteNbreadId: string,
) => {
  try {
    const { data, error } = await supabase
      .from('nbread_invite')
      .select('target_user_id,nbread_id,status')
      .eq('target_user_id', userId)
      .eq('nbread_id', inviteNbreadId)

    if (!data) {
      console.error('error : ', error)
      return
    }
    return data
  } catch (error) {}
}
