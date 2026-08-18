import type { SupabaseClient } from '@supabase/supabase-js'
import { PostInsert } from '@/types/post'

export const insertPost = async (
  client: SupabaseClient,
  nbreadId: string,
  userId: string,
  post: PostInsert,
) => {
  const { error } = await client.from('post').insert([
    {
      content: post.content,
      user_id: userId,
      user_name: post.userName,
      profile_image: post.userProfileImage,
      nbread_id: nbreadId,
      created_at: post.createdAt,
    },
  ])

  if (error) {
    console.error('Error inserting post:', error)
    throw error
  }
}
