import { supabase } from '@/lib/supabaseClient'

export const deleteNotification = async (
  notificationId: number,
  userId: string,
) => {
  const { data, error } = await supabase
    .from('notification')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    console.error('Error deleting notification:', error)
    throw error
  }

  if (data.length !== 1) {
    throw new Error('Notification not found or not owned by the current user')
  }
}

export const deleteAllNotifications = async (userId: string) => {
  const { error } = await supabase
    .from('notification')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting notifications:', error)
    throw error
  }
}
