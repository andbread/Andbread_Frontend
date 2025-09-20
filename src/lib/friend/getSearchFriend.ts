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
    const { data: friends } = await supabase
      .from('friend_request')
      .select('sender_id, receiver_id, status')
      .eq('sender_id', senderId) // 또는 receiver_id 포함
    return (user ?? []).map((user) => ({
      name: user.name,
      profileImage: user.profile_image,
      senderId: senderId,
      receiverId: user.id,
      status:
        friends?.find((f) => f.receiver_id === user.id)?.status ||
        '친구 추가하기',
    }))
  } catch (error) {}
}
