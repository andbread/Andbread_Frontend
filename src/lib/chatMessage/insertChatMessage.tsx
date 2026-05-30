import { supabase } from '@/lib/supabaseClient'
import { ChatMessage } from '@/types/chatMessage'
import { User } from '@/types/user'

export const insertChatMessage = async (
  user: User,
  nbreadId: string,
  content: string,
): Promise<ChatMessage> => {
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
      .select('*')
      .single()

    if (error || !data) {
      console.error('Error inserting chat messages:', error)
      throw error
    }

    return {
      id: data.id,
      content: data.content,
      nbreadId: data.nbread_id,
      userId: data.user_id ?? '',
      userName: data.user_name,
      userProfileImage: data.user_profile_image,
      createdAt: data.created_at,
    }
  } catch (error) {
    throw error
  }
}
