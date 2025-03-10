import { supabase } from '@/lib/supabaseClient'

export const deleteParticipants = async (userId: string, nbreadId: string) => {
  const { data, error } = await supabase
    .from('participant')
    .delete()
    .eq('user_id', userId)
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error('error deleting participants', error)
    throw error
  }

  return data
}
