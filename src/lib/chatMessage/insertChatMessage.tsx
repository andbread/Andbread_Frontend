import { supabase } from '@/lib/supabaseClient'
import { User } from '@/types/user'

export const insertChatMessage = async (
  user: User,
  nbreadId: string,
  content: string,
) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        nbread_id: nbreadId,
        user_id: user.id,
        user_name: user.name,
        user_profile_image: user.profileImage,
        content: content,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting chat messages:', error)
      throw error
    }

    return data.id
  } catch (error) {
    throw error
  }
}
