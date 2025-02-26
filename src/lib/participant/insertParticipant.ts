import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types/nbread'

export const insertParticipant = async (
  participant: Participant,
  nbreadId: string,
) => {
  const { data, error } = await supabase.from('participant').insert({
    nbread_id: nbreadId,
    user_id: participant.user.id,
    is_leader: participant.isLeader,
  })

  if (error) {
    console.error('Error inserting participant:', error)
    return null
  }

  return data
}
