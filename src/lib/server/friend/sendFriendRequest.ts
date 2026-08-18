import type { SupabaseClient } from '@supabase/supabase-js'

export interface FriendRequestStatus {
  status: string
}

/**
 * .or() 필터를 문자열로 조립하는 기존 방식을 그대로 옮긴다.
 */
export const sendFriendRequest = async (
  client: SupabaseClient,
  senderId: string,
  receiverId: string,
  status: string,
): Promise<FriendRequestStatus[] | null> => {
  const { data, error } = await client
    .from('friend_request')
    .select('status')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`,
    )

  if (error) {
    console.error('error : ', error)
    return null
  }

  if (!data || data.length === 0) {
    // 데이터 없으면 insert
    const { data: insertedData, error: insertError } = await client
      .from('friend_request')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          status: status,
        },
      ])
      .select('status')

    if (insertError) console.error(insertError)
    return insertedData
  }

  if (data.some((item) => item.status === 'rejected')) {
    // 기존 데이터 중 rejected이면 update
    const { data: updatedData, error: updateError } = await client
      .from('friend_request')
      .update({ status })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .select('status')

    if (updateError) console.error(updateError)
    return updatedData
  }

  // 이미 pending이나 accepted 상태라면 그대로 반환
  return data
}
