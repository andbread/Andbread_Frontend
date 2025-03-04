import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types/nbread'
import { UserRow } from '@/types/supabase'

type GetParticipantsType = { user: UserRow; is_leader: boolean }[]

export const getParticipants = async (
  nbreadId: string,
): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from('participant')
    .select('user!inner(*), is_leader')
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error('error fetching participants', error)
    throw error
  }

  const participants: Participant[] = (
    data as unknown as GetParticipantsType
  ).map((item) => ({
    user: {
      id: item.user.id,
      name: item.user.name,
      profileImage: item.user.profile_image,
      email: item.user.email,
      socialType: item.user.social_type as 'kakao' | 'google',
    },
    isLeader: item.is_leader,
  }))

  return participants
}
export const isGetParticipantsUser = async (participant: Participant, nbreadId: string,) => {
  const {data,error} = await supabase.from('participant')
  .select('*')
  .eq('nbread_id',nbreadId)
  .eq('user_id',participant.user.id)
  .maybeSingle()

  if(error){
    console.error(error)
    return 
  }
  console.log('현재 엔빵에 이유저가 있어? 있다면 누구니.. : ',data)
  return data
}
export const participantUsers = async (nbreadId :string) => {
  const {data,error} = await supabase.from('participant')
  .select('*')  // 'exact'를 사용하여 정확한 개수 반환
  .eq('nbread_id', nbreadId);

  if(error) {
    console.log(error)
    return
  }
  console.log("참가한 인원 : ",data)
  return data
}
