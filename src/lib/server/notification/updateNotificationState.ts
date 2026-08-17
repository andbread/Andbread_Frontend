import type { SupabaseClient } from '@supabase/supabase-js'
import {
  mapNotificationSettings,
  NOTIFICATION_SETTINGS_COLUMNS,
  type NotificationSettings,
} from './getNotificationState'

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

export const updateNotificationState = async (
  client: SupabaseClient,
  userId: string,
  settings: NotificationSettingsUpdate,
): Promise<NotificationSettings> => {
  const { data, error } = await client
    .from('user_notification_settings')
    .upsert(
      {
        user_id: userId,
        ...mapNotificationSettingsUpdate(settings),
      },
      { onConflict: 'user_id' },
    )
    .select(NOTIFICATION_SETTINGS_COLUMNS)
    .single()

  if (error) {
    console.error('Error updating notification state:', error)
    throw error
  }

  return mapNotificationSettings(data)
}
