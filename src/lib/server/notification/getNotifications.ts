import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { Notification, NotificationType } from '@/types/notification'
import { NotificationRow } from '@/types/supabase'

type GetNotificationType = {
  data: NotificationRow[] | null
  error: PostgrestError | null
}

/**
 * 정렬(sortNotifications)은 순수 함수이므로 클라이언트에 남긴다.
 */
export const getNotification = async (
  client: SupabaseClient,
  userId: string,
): Promise<Notification[]> => {
  const { data, error }: GetNotificationType = await client
    .from('notification')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Error get notifications:', error)
    throw error ?? new Error('Error get notifications')
  }

  return (data as NotificationRow[]).map((notification) => ({
    id: notification.id,
    user_id: notification.user_id!,
    created_at: notification.created_at,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    type: notification.type as NotificationType,
    is_read: notification.is_read,
  }))
}
