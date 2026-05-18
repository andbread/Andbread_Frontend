import { supabase } from "../supabaseClient"
export const updateAcceptInvite = async (
  receiverId: string,
  senderId: string | null,
) => {
    let paymentDate = null;
  const { data, error } = await supabase
    .from('nbread_invite')
    .update({ state: 'accepted' })
    .eq('nbread_id', senderId)
    .eq('invited_user_id', receiverId)

  if (error) {
    console.error('초대 수락 업데이트 실패!', error)
    return null
  }
  console.log('data', data)
  if(!error){
    const {data,error} = await supabase.from('nbread_records').select('payment_date').eq('nbread_id',senderId)

    if(error) {
        console.error('error : ',error)
        return
    }
    console.log('초대 받은 엔빵 데이터 : ',data)
    paymentDate = data?.[0]?.payment_date ?? null
  }
  if (!error) {
    const { data, error } = await supabase
      .from('participant')
      .insert([{ nbread_id:senderId,user_id:receiverId,is_leader:'FALSE'}])

    if (error) {
      console.error('엔빵 추가 에러 : ', error)
      return null
    }
    console.log(data)
    return data
  }
}
export const updateRejectedInvite = async (
  receiverId: string,
  senderId: string | null,
) => {
  const { data, error } = await supabase
    .from('nbread_invite')
    .update({ state: 'rejected' })
    .eq('nbread_id', senderId)
    .eq('invited_user_id', receiverId)
    if(error) {
        console.error('엔빵 거절 에러 : ',error)
    }
}