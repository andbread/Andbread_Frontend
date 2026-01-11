import { supabase } from '@/lib/supabaseClient'

export async function updateNotificationState(
  userId: string,
  enabled: boolean,
) {
  try {
    const { data, error } = await supabase
      .from('user')
      .update({ notification_enabled: enabled })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating notification state:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating notification state:', error)
    throw error
  }
}
