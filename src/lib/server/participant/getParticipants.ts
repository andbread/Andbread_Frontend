import type { SupabaseClient } from '@supabase/supabase-js'
import { Participant } from '@/types/nbread'
import { UserRow } from '@/types/supabase'

type GetParticipantsType = { user: UserRow; is_leader: boolean }[]

export const getParticipants = async (
  client: SupabaseClient,
  nbreadId: string,
): Promise<Participant[]> => {
  const { data, error } = await client
    .from('participant')
    .select('user!inner(*), is_leader')
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error('error fetching participants', error)
    throw error
  }

  return (data as unknown as GetParticipantsType).map((item) => ({
    user: {
      id: item.user.id,
      name: item.user.name,
      profileImage: item.user.profile_image,
      email: item.user.email,
      socialType: item.user.social_type as 'kakao' | 'google',
      tag: Number(item.user.tag),
    },
    isLeader: item.is_leader,
  }))
}

/**
 * insertParticipant 전용 헬퍼다. API로 노출하지 않는다.
 */
export const isGetParticipantsUser = async (
  client: SupabaseClient,
  userId: string,
  nbreadId: string,
) => {
  const { data, error } = await client
    .from('participant')
    .select('*')
    .eq('nbread_id', nbreadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error(error)
    return
  }

  return data
}

/**
 * insertParticipant 전용 헬퍼다. API로 노출하지 않는다.
 */
export const participantUsers = async (
  client: SupabaseClient,
  nbreadId: string,
) => {
  const { data, error } = await client
    .from('participant')
    .select('*')
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error(error)
    return
  }

  return data
}
