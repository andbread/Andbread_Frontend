import type { SupabaseClient } from '@supabase/supabase-js'
import { Post } from '@/types/post'

/**
 * 응답은 camelCase 규약을 따라 Post 타입으로 맞춘다.
 * createdAt은 원시 값을 그대로 주고, 표시용 날짜 포맷은 호출부가 담당한다.
 */
export const getPost = async (
  client: SupabaseClient,
  nbreadId: string,
): Promise<Post[]> => {
  const { data, error } = await client
    .from('post')
    .select('*')
    .eq('nbread_id', nbreadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('게시글을 찾을수 없어!', error)
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content ?? '',
    userId: row.user_id ?? '',
    userName: row.user_name ?? '',
    userProfileImage: row.profile_image ?? '',
    nbreadId: row.nbread_id,
    createdAt: row.created_at,
  }))
}
