import { supabase } from '../supabaseClient'
import { sendFriendProps } from '@/components/friend/PlusFriendListItem'
export const sendFriendRequest = async ({
  receiverId,
  senderId,
  status,
}: sendFriendProps) => {
  const { data, error } = await supabase
    .from('friend_request')
    .select('status')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
    )
  if (error) {
    console.error('error : ', error)
    return
  }
  //   return data
  if (!data || data.length === 0) {
    // 데이터 없으면 insert
    const { data: insertedData, error } = await supabase
      .from('friend_request')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          status: status,
        },
      ])
      .select('status')

    if (error) console.error(error)
    return insertedData
  } else if (data.some((item) => item.status === 'rejected')) {
    // 기존 데이터 중 rejected이면 update
    const { data: updatedData, error } = await supabase
      .from('friend_request')
      .update({ status })
      .eq('sender_id',senderId)
      .eq('receiver_id',receiverId)
      .select('status')

    if (error) console.error(error)
    return updatedData
  }

  // 이미 pending이나 accepted 상태라면 그대로 반환
  return data
}
