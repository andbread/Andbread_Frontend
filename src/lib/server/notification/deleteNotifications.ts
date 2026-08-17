import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 삭제된 행 수를 돌려준다.
 * 1이 아닌 경우의 처리(404 매핑)는 Route Handler가 담당한다.
 */
export const deleteNotification = async (
  client: SupabaseClient,
  notificationId: number,
  userId: string,
): Promise<number> => {
  const { data, error } = await client
    .from('notification')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    console.error('Error deleting notification:', error)
    throw error
  }

  return data?.length ?? 0
}

export const deleteAllNotifications = async (
  client: SupabaseClient,
  userId: string,
) => {
  const { error } = await client
    .from('notification')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting notifications:', error)
    throw error
  }
}
