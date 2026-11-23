import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * receiverId는 요청을 받아 수락하는 쪽, 즉 현재 사용자다.
 * 오류를 삼키고 null을 돌려주던 기존 동작은 클라이언트 lib에서 유지한다.
 */
export const updateAcceptFriend = async (
  client: SupabaseClient,
  receiverId: string,
  senderId: string,
) => {
  const { error } = await client
    .from('friend_request')
    .update({ status: 'accepted' })
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)

  if (error) {
    console.error('친구 수락 업데이트 실패!', error)
    throw error
  }

  const { error: insertError } = await client
    .from('friend')
    .insert([{ user_id_1: receiverId, user_id_2: senderId }])

  if (insertError) {
    console.error('친구 추가 에러 : ', insertError)
    throw insertError
  }
}

export const updateRejectedFriend = async (
  client: SupabaseClient,
  receiverId: string,
  senderId: string,
) => {
  const { error } = await client
    .from('friend_request')
    .update({ status: 'rejected' })
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)

  if (error) {
    console.error('친구 거절 업데이트 실패!', error)
    throw error
  }
}
