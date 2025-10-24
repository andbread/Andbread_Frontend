import { supabase } from '../supabaseClient'

export const getSearchFriend = async (tag: string, senderId: string) => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('name,profile_image,id')
      .eq('tag', tag)
      .neq('id', senderId)

    if (error) {
      console.error(error)
    }
    const userIds = user?.map((u) => u.id) || []
    const { data: friends } = await supabase
      .from('friend_request')
      .select('sender_id, receiver_id, status')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${userIds}),and(sender_id.eq.${userIds},receiver_id.eq.${senderId})`,
      )
    return (user ?? []).map((user) => ({
      name: user.name,
      profileImage: user.profile_image,
      senderId: senderId,
      receiverId: user.id,
      status: friends?.find((f) => f)?.status || '친구 추가하기',
    }))
  } catch (error) {}
}
export const getFriendList = async (user: string | null) => {
  if (!user) return
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

    console.log('친구리스트 목록', friends)
    // return friends
    if (friends) {
      const { data, error } = await supabase
        .from('user')
        .select('name,profile_image,tag')
        .eq('id', friends)

        if(error) {
          console.error('error~~~~ : ',error)
          return
        }
       const friendInfoList = data || []

  // 필요에 따라 map으로 구조 변환
  const processedFriends = friendInfoList.map(f => ({
    name: f.name,
    profileImage: f.profile_image,
    tag: f.tag
  }))
  return processedFriends
    }
  } catch (error) {
    console.error(error)
    return []
  }
  return []
}
