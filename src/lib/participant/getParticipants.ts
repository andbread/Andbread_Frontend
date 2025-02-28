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
