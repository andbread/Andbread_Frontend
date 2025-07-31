import { supabaseClient } from '../_shared/createClient.ts'
import { Notification } from '../types/types.ts'

export const insertNotificationResult = async (
  notificationData: Notification,
) => {
  try {
    const { data: insertNotificationData, error: insertNotificationError } =
      await supabaseClient.from('notification').insert({
        user_id: notificationData.user_id,
        title: notificationData.title,
        message: notificationData.message,
        url: notificationData.url,
        is_read: notificationData.is_read,
        type: notificationData.type,
      })

    if (
      insertNotificationData === null ||
      !insertNotificationData ||
      insertNotificationError
    ) {
      console.error('Insert Notification Error:', insertNotificationError)
      return insertNotificationError
    }
    return insertNotificationData
  } catch (error) {
    console.error('Unexpected Error:', error)
    throw error
  }
}
