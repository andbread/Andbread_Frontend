import { supabase } from '../supabaseClient'
import { PostInsert } from '@/types/post'

export const InsertPost = async (post: PostInsert) => {
  try {
    const { data, error } = await supabase
      .from('post')
      .insert([
        {
          content: post.content,
          user_id: post.userId,
          user_name: post.userName,
          profile_image: post.userProfileImage,
          nbread_id: post.nbreadId,
          created_at: post.createdAt,
        },
      ])
      
      if (error) {
      console.error('Error inserting post:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error(error)
  }
}
