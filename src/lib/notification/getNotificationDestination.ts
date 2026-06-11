import type { Notification, NotificationType } from '@/types/notification'
import type { Json } from '@/types/supabase'

const getStringValue = (data: Json | null, keys: string[]) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.length > 0) return value
  }

  return null
}

export const getNotificationDestination = (
  notification: Pick<Notification, 'type' | 'data'>,
): string | null => {
  const nbreadId = getStringValue(notification.data, ['nbreadId', 'nbread_id'])

  switch (notification.type) {
    case 'invite': {
      const inviteToken = getStringValue(notification.data, [
        'inviteToken',
        'invite_token',
      ])
      return inviteToken ? `/invite/${encodeURIComponent(inviteToken)}` : null
    }
    case 'chat':
      return nbreadId
        ? `/nbread/${encodeURIComponent(nbreadId)}?tab=chat`
        : null
    case 'payment':
    case 'invite_accept':
      return nbreadId ? `/nbread/${encodeURIComponent(nbreadId)}` : null
    case 'friend_response':
      return '/friendList'
    case 'friend_request':
      return null
  }
}

export const getNotificationDestinationError = (
  type: NotificationType,
): string => {
  if (type === 'invite') return '초대 정보를 찾을 수 없어요.'
  if (type === 'friend_request') return ''
  return '이동할 페이지 정보를 찾을 수 없어요.'
}
