import type { SupabaseClient } from '@supabase/supabase-js'

export const deletePost = async (client: SupabaseClient, postId: number) => {
  const { error } = await client.from('post').delete().eq('id', postId)

  if (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}
