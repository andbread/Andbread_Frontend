import { supabase } from "../supabaseClient";

export const sendInviteRequest = async (nbreadId:string,invitedUserId:string,state:string) => {
    try {
        // const {data, error} = await supabase.from('nbread_invite').insert(
        //     [
        //         {
        //             nbread_id: nbreadId,
        //             invited_user_id: invitedUserId,
        //             state: "pending"
        //         },
        //     ],
        // )
        const { data, error } = await supabase
    .from('nbread_invite')
    .select('state')
    .eq('nbread_id',nbreadId)
    .eq('invited_user_id',invitedUserId)
  if (error) {
    console.error('error : ', error)
    return
  }
  console.log('data', data)
  //   return data
  if (!data || data.length === 0) {
    // 데이터 없으면 insert
    const { data: insertedData, error } = await supabase
      .from('nbread_invite')
      .insert([
        {
          nbread_id: nbreadId,
          invited_user_id: invitedUserId,
          state: state,
        },
      ])
      .select('state')

    if (error) console.error(error)
    return insertedData
  } else if (data.some((item) => item.state === 'rejected')) {
    // 기존 데이터 중 rejected이면 update
    const { data: updatedData, error } = await supabase
      .from('nbread_invite')
      .update({ state })
      .eq('nbread_id',nbreadId)
      .eq('invited_user_id',invitedUserId)
      .select('state')

    if (error) console.error(error)
    return updatedData
  }

  // 이미 pending이나 accepted 상태라면 그대로 반환
  return data
        if(error) throw error
        return data
    } catch (error) {
        console.error("초대 요청 중 오류 발생:", error)
    }
}