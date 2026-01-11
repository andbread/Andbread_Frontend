import { supabase } from '@/lib/supabaseClient'

export const getNotificationState = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('notification_enabled')
      .eq('user_id', userId)
      .single()

    const notification_enabled = data?.notification_enabled ?? null

    if (error || notification_enabled === null) {
      console.error('Error get notification state:', error)
      throw error
    }

    return notification_enabled
  } catch (error) {
    console.error('Error fetching notification state:', error)
    throw error
  }
}
