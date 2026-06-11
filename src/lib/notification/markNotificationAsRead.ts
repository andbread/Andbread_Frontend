import { supabase } from '@/lib/supabaseClient'

export const markNotificationAsRead = async (
  notificationId: number,
  userId: string,
) => {
  const { data, error } = await supabase
    .from('notification')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw error
  }

  if (data.length !== 1) {
    throw new Error('Notification not found or not owned by the current user')
  }
}
