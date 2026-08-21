import type { SupabaseClient } from '@supabase/supabase-js'

export interface FriendListItem {
  name: string
  profileImage: string | null
  tag: string
  id: string
  inviteState?: string
}

export interface SearchFriendItem {
  name: string
  profileImage: string | null
  senderId: string
  receiverId: string
  status: string
}

interface NbreadInviteRow {
  status: string
  target_user_id: string
  created_at: string
}

/**
 * .or() 필터를 문자열로 조립하는 기존 방식을 그대로 옮긴다.
 * 값이 UUID라 위험은 낮다고 보고 이번에는 손대지 않는다.
 */
export const getSearchFriend = async (
  client: SupabaseClient,
  tag: string,
  senderId: string,
): Promise<SearchFriendItem[]> => {
  const { data: user, error } = await client
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
  const { data: friends, error: friendsError } = await client
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
}

export const getFriendList = async (
  client: SupabaseClient,
  user: string | null,
  nbreadId: string | null,
): Promise<FriendListItem[]> => {
  if (!user) return []

  const { data, error } = await client
    .from('friend')
    .select('user_id_1,user_id_2')
    .or(`user_id_1.eq.${user},user_id_2.eq.${user}`)

  if (error) {
    console.error('친구리스트 불러오기error : ', error)
    return []
  }

  const friends =
    data?.map((f) => (f.user_id_1 === user ? f.user_id_2 : f.user_id_1)) || []

  if (friends.length === 0) return []

  const { data: friendInfo, error: friendInfoError } = await client
    .from('user')
    .select('name,profile_image,tag,id')
    .in('id', friends)

  if (friendInfoError) {
    console.error('error~~~~ : ', friendInfoError)
    return []
  }

  const processedFriends: FriendListItem[] = (friendInfo || []).map((f) => ({
    name: f.name,
    profileImage: f.profile_image,
    tag: f.tag,
    id: f.id,
  }))

  if (!nbreadId) return processedFriends

  const friendIds = processedFriends.map((f) => f.id)
  const { data: invites, error: inviteError } = await client
    .from('nbread_invite')
    .select('status,target_user_id,created_at')
    .in('target_user_id', friendIds)
    .eq('nbread_id', nbreadId)
    // find가 사용자별 최신 초대를 선택할 수 있도록 최신순으로 정렬한다.
    .order('created_at', { ascending: false })

  if (inviteError) {
    console.error('error~~', inviteError)
    return []
  }

  const inviteData: NbreadInviteRow[] = invites || []

  return processedFriends.map((friend) => {
    const invite = inviteData.find((i) => i.target_user_id === friend.id)
    return {
      ...friend,
      inviteState: invite
        ? invite.status === 'pending'
          ? '초대 완료' // pending은 초대 완료로 바꿔 보여준다.
          : invite.status
        : '초대 하기',
    }
  })
}
