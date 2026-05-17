import { supabase } from '@/lib/supabaseClient'

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

const mapNotificationSettings = (
  row: NotificationSettingsRow,
): NotificationSettings => ({
  userId: row.user_id,
  allEnabled: row.all_enabled,
  chatEnabled: row.chat_enabled,
  inviteEnabled: row.invite_enabled,
  friendEnabled: row.friend_enabled,
  paymentEnabled: row.payment_enabled,
})

const createDefaultNotificationSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .insert({
      user_id: userId,
      all_enabled: true,
      chat_enabled: true,
      invite_enabled: true,
      friend_enabled: true,
      payment_enabled: true,
    })
    .select(
      'user_id, all_enabled, chat_enabled, invite_enabled, friend_enabled, payment_enabled',
    )
    .single()

  if (error) {
    console.error('Error creating notification settings:', error)
    throw error
  }

  return mapNotificationSettings(data as NotificationSettingsRow)
}

export const getNotificationState = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select(
        'user_id, all_enabled, chat_enabled, invite_enabled, friend_enabled, payment_enabled',
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error get notification state:', error)
      throw error
    }

    if (!data) {
      return createDefaultNotificationSettings(userId)
    }

    return mapNotificationSettings(data as NotificationSettingsRow)
  } catch (error) {
    console.error('Error fetching notification state:', error)
    throw error
  }
}
