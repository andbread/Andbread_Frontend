import type { SupabaseClient } from '@supabase/supabase-js'
import { ChatMessage } from '@/types/chatMessage'

/**
 * formattedTime은 JSON으로 실어 나를 수 없는 표시용 값이라 클라이언트 lib이 만든다.
 * 서버는 원시 값만 내려보낸다.
 */
export type ChatMessagePayload = Omit<ChatMessage, 'formattedTime'>

/* getChatMessages: DB로부터 그룹 메시지 내역을 불러옴 */
export const getChatMessages = async (
  client: SupabaseClient,
  nbreadId: string,
): Promise<ChatMessagePayload[]> => {
  const { data, error } = await client
    .from('chat_messages')
    .select('*')
    .eq('nbread_id', nbreadId)

  if (error || !data) {
    console.error('Error get chat messages:', error)
    throw error ?? new Error('Error get chat messages')
  }

  return data.map((item) => ({
    id: item.id,
    content: item.content,
    nbreadId: item.nbread_id,
    userId: item.user_id ?? '',
    userName: item.user_name,
    userProfileImage: item.user_profile_image,
    createdAt: item.created_at,
  }))
}
