import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatMessagePayload } from './getChatMessages'

export const insertChatMessage = async (
  client: SupabaseClient,
  nbreadId: string,
  userId: string,
  userName: string,
  userProfileImage: string | null,
  content: string,
): Promise<ChatMessagePayload> => {
  const { data, error } = await client
    .from('chat_messages')
    .insert({
      nbread_id: nbreadId,
      user_id: userId,
      user_name: userName,
      user_profile_image: userProfileImage,
      content: content,
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error inserting chat messages:', error)
    throw error ?? new Error('Error inserting chat messages')
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
}
