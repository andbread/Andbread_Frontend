import { supabase } from '@/lib/supabaseClient'
import type { NotificationSettings } from './getNotificationState'

export type NotificationSettingsUpdate = Partial<
  Omit<NotificationSettings, 'userId'>
>

const mapNotificationSettingsUpdate = (
  settings: NotificationSettingsUpdate,
) => ({
  ...(settings.allEnabled !== undefined && {
    all_enabled: settings.allEnabled,
  }),
  ...(settings.chatEnabled !== undefined && {
    chat_enabled: settings.chatEnabled,
  }),
  ...(settings.inviteEnabled !== undefined && {
    invite_enabled: settings.inviteEnabled,
  }),
  ...(settings.friendEnabled !== undefined && {
    friend_enabled: settings.friendEnabled,
  }),
  ...(settings.paymentEnabled !== undefined && {
    payment_enabled: settings.paymentEnabled,
  }),
})

export async function updateNotificationState(
  userId: string,
  settings: NotificationSettingsUpdate,
) {
  try {
    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(
        {
          user_id: userId,
          ...mapNotificationSettingsUpdate(settings),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single()

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
