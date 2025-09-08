import { supabase } from "../supabaseClient"

export const UpdatePost = async (post : any) => {
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