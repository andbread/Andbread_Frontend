import { supabase } from '../supabaseClient'

export const updateAcceptFriend = async (
  receiverId: string,
  senderId: string | null,
) => {
  const { data, error } = await supabase
    .from('friend_request')
    .update({ status: 'accepted' })
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)

  if (error) {
    console.error('친구 수락 업데이트 실패!', error)
    return null
  }
  console.log('data',data)
  if(!error) {
    const {data,error} =await supabase.from('friend').insert([{user_id_1 : receiverId, user_id_2 : senderId}])

    if(error) {
        console.error('친구 추가 에러 : ',error)
        return null
    }
    console.log(data)
    return data
  }
}
export const updateRejectedFriend = async(receiverId: string,
  senderId: string | null,) => {
  const {data, error} = await supabase.from('friend_request').update({status:'rejected'}).eq('sender_id',senderId).eq('receiver_id',receiverId)
}
