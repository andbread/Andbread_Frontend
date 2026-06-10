import type { Notification } from '@/types/notification'

export const sortNotifications = (
  notifications: Notification[],
): Notification[] =>
  [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return Number(a.is_read) - Number(b.is_read)
    }

    const createdAtDifference =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

    return createdAtDifference || b.id - a.id
  })
