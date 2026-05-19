import { supabase } from '@/lib/supabaseClient'
import { captureAppError } from '@/lib/sentry'

export const deleteParticipants = async (userId: string, nbreadId: string) => {
  const { data, error } = await supabase
    .from('participant')
    .delete()
    .eq('user_id', userId)
    .eq('nbread_id', nbreadId)

  if (error) {
    console.error('error deleting participants', error)
    captureAppError(error, {
      action: 'participant.delete',
      tags: { userId, nbreadId },
    })
    throw error
  }

  return data
}
