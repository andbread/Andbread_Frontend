import { supabase } from "../supabaseClient"
import { Post } from '@/types/post'

export const UpdatePost = async (post : Pick<Post, 'id' | 'content'>) => {
    try {
    const { data, error } = await supabase
      .from('post')
      .update({
        content : post.content,
      })
      .eq('id', post.id)
    if (error) {
      console.error('Error updating post:', error)
      throw error
    }

    return data
    } catch (error) {
        
    }
}