import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 갱신된 행 수를 돌려준다.
 * 1이 아닌 경우의 처리(404 매핑)는 Route Handler가 담당한다.
 */
export const markNotificationAsRead = async (
  client: SupabaseClient,
  notificationId: number,
  userId: string,
): Promise<number> => {
  const { data, error } = await client
    .from('notification')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw error
  }

  return data?.length ?? 0
}
