import { supabase } from '@/lib/supabaseClient'
import { captureAppError } from '@/lib/sentry/sentry'

export const deleteNbread = async (nbreadId: string) => {
  try {
    const { data, error } = await supabase
      .from('nbread')
      .delete()
      .eq('id', nbreadId)

    if (error) {
      console.error('Error inserting nbread:', error)
      throw error
    }

    return data
  } catch (error) {
    captureAppError(error, {
      action: 'nbread.delete',
      tags: { nbreadId },
    })
    throw error
  }
}
