import type { SupabaseClient } from '@supabase/supabase-js'

export const updatePost = async (
  client: SupabaseClient,
  postId: number,
  content: string,
) => {
  const { error } = await client
    .from('post')
    .update({ content })
    .eq('id', postId)

  if (error) {
    console.error('Error updating post:', error)
    throw error
  }
}
