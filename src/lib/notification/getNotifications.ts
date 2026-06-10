import { supabase } from '@/lib/supabaseClient'
import { Notification, NotificationType } from '@/types/notification'
import { NotificationRow } from '@/types/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { sortNotifications } from './sortNotifications'

type GetNotificationType = {
  data: NotificationRow[] | null
  error: PostgrestError | null
}

export const getNotification = async (userId: string) => {
  try {
    const { data, error }: GetNotificationType = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Error get notifications:', error)
      throw error
    }

    const notifications: Notification[] = (data as NotificationRow[])?.map(
      (notification) => ({
        id: notification.id,
        user_id: notification.user_id!,
        created_at: notification.created_at,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        type: notification.type as NotificationType,
        is_read: notification.is_read,
      }),
    )
    return sortNotifications(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}
