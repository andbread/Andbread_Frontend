import { supabase } from '../supabaseClient'

export interface FriendListItem {
  name: string
  profileImage: string | null
  tag: string
  id: string
  inviteState?: string
}

export const getSearchFriend = async (tag: string, senderId: string) => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('name,profile_image,id')
      .eq('tag', tag)
      .neq('id', senderId)

    if (error) {
      console.error(error)
      return []
    }
    const userIds = user?.map((u) => u.id) || []

    if (userIds.length === 0) {
      return []
    }

    const userIdsFilter = userIds.join(',')
    const { data: friends, error: friendsError } = await supabase
      .from('friend_request')
      .select('sender_id, receiver_id, status')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.in.(${userIdsFilter})),and(sender_id.in.(${userIdsFilter}),receiver_id.eq.${senderId})`,
      )

    if (friendsError) {
      console.error(friendsError)
      return []
    }

    return (user ?? []).map((user) => ({
      name: user.name,
      profileImage: user.profile_image,
      senderId: senderId,
      receiverId: user.id,
      status:
        friends?.find(
          (friend) =>
            (friend.sender_id === senderId && friend.receiver_id === user.id) ||
            (friend.sender_id === user.id && friend.receiver_id === senderId),
        )?.status || '친구 추가하기',
    }))
  } catch (error) {
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
    const { data, error } = await supabase
      .from('friend')
      .select('user_id_1,user_id_2')
      .or(`user_id_1.eq.${user},user_id_2.eq.${user}`)

    if (error) {
      console.error('친구리스트 불러오기error : ', error)
      return []
    }
    const friends =
      data?.map((f) => (f.user_id_1 === user ? f.user_id_2 : f.user_id_1)) || []

    if (friends.length > 0) {
      const { data, error } = await supabase
        .from('user')
        .select('name,profile_image,tag,id')
        .in('id', friends)

      if (error) {
        console.error('error~~~~ : ', error)
        return []
      }
      const friendInfoList = data || []

      // 필요에 따라 map으로 구조 변환
      const processedFriends: FriendListItem[] = friendInfoList.map((f) => ({
        name: f.name,
        profileImage: f.profile_image,
        tag: f.tag,
        id: f.id,
      }))

      const friendIds = processedFriends.map((f) => f.id)
      let inviteData: any[] = []
      if (nbreadId) {
        const { data, error } = await supabase
          .from('nbread_invite')
          .select('status,target_user_id')
          .in('target_user_id', friendIds)
          .eq('nbread_id', nbreadId)
        if (error) {
          console.error('error~~', error)
          return []
        }
        inviteData = data || []
        const mergedFriends = processedFriends.map((friend) => {
          const invite = inviteData.find((i) => i.target_user_id === friend.id)
          return {
            ...friend,
            inviteState: invite
              ? invite.status === 'pending'
                ? '초대 완료' // ✅ pending → 초대 완료로 변환
                : invite.status // 그 외 상태는 그대로 유지
              : '초대 하기', // 초대 기록 없으면 null
          }
        })
        return mergedFriends
      }

      return processedFriends
    }
    return []
  } catch (error) {
    console.error(error)
    return []
  }
}
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
