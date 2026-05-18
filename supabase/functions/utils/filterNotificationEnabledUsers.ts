import { supabaseClient } from '../_shared/createClient.ts'

export type NotificationSettingField =
  | 'chat_enabled'
  | 'invite_enabled'
  | 'friend_enabled'
  | 'payment_enabled'

type NotificationSettingsRow = {
  user_id: string
  all_enabled: boolean | null
} & Record<NotificationSettingField, boolean | null>

export const filterNotificationEnabledUsers = async (
  userIds: string[],
  settingField: NotificationSettingField,
) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean)

  if (uniqueUserIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseClient
    .from('user_notification_settings')
    .select(`user_id, all_enabled, ${settingField}`)
    .in('user_id', uniqueUserIds)

  if (error) {
    console.error('Error fetching notification settings:', error)
    throw error
  }

  const settingsByUserId = new Map(
    ((data ?? []) as NotificationSettingsRow[]).map((settings) => [
      settings.user_id,
      settings,
    ]),
  )

  return uniqueUserIds.filter((userId) => {
    const settings = settingsByUserId.get(userId)

    if (!settings) {
      return true
    }

    return settings.all_enabled !== false && settings[settingField] !== false
  })
}
