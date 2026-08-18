import type { SupabaseClient } from '@supabase/supabase-js'

export const deleteParticipants = async (
  client: SupabaseClient,
  userId: string,
  nbreadId: string,
) => {
  const { error } = await client
    .from('participant')
    .delete()
    .eq('user_id', userId)
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error('error deleting participants', error)
    throw error
  }
}
