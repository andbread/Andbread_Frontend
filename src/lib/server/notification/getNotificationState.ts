import type { SupabaseClient } from '@supabase/supabase-js'

export interface NotificationSettings {
  userId: string
  allEnabled: boolean
  chatEnabled: boolean
  inviteEnabled: boolean
  friendEnabled: boolean
  paymentEnabled: boolean
}

interface NotificationSettingsRow {
  user_id: string
  all_enabled: boolean
  chat_enabled: boolean
  invite_enabled: boolean
  friend_enabled: boolean
  payment_enabled: boolean
}

export const NOTIFICATION_SETTINGS_COLUMNS =
  'user_id, all_enabled, chat_enabled, invite_enabled, friend_enabled, payment_enabled'

export const mapNotificationSettings = (
  row: NotificationSettingsRow,
): NotificationSettings => ({
  userId: row.user_id,
  allEnabled: row.all_enabled,
  chatEnabled: row.chat_enabled,
  inviteEnabled: row.invite_enabled,
  friendEnabled: row.friend_enabled,
  paymentEnabled: row.payment_enabled,
})

const createDefaultNotificationSettings = async (
  client: SupabaseClient,
  userId: string,
) => {
  const { data, error } = await client
    .from('user_notification_settings')
    .insert({
      user_id: userId,
      all_enabled: true,
      chat_enabled: true,
      invite_enabled: true,
      friend_enabled: true,
      payment_enabled: true,
    })
    .select(NOTIFICATION_SETTINGS_COLUMNS)
    .single()

  if (error) {
    console.error('Error creating notification settings:', error)
    throw error
  }

  return mapNotificationSettings(data as NotificationSettingsRow)
}

/**
 * 설정 행이 없으면 기본값을 생성해 돌려주는 기존 동작을 그대로 유지한다.
 */
export const getNotificationState = async (
  client: SupabaseClient,
  userId: string,
): Promise<NotificationSettings> => {
  const { data, error } = await client
    .from('user_notification_settings')
    .select(NOTIFICATION_SETTINGS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error get notification state:', error)
    throw error
  }

  if (!data) {
    return createDefaultNotificationSettings(client, userId)
  }

  return mapNotificationSettings(data as NotificationSettingsRow)
}
