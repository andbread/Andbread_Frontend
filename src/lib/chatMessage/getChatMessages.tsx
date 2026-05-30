import { supabase } from '@/lib/supabaseClient'
import { ChatMessage } from '@/types/chatMessage'

/* getChatMessages: DB로부터 그룹 메시지 내역을 불러옴 */
export const getChatMessages = async (nbreadId: string) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('nbread_id', nbreadId)

    if (error || !data) {
      console.error('Error get chat messages:', error)
      throw error
    }

    // 불러온 row data를 ChatMessage 타입으로 매핑
    const chatMessages: ChatMessage[] = data.map((item) => ({
      id: item.id,
      content: item.content,
      nbreadId: item.nbread_id,
      userId: item.user_id ?? '',
      userName: item.user_name,
      userProfileImage: item.user_profile_image,
      createdAt: item.created_at,
    }))

    return chatMessages
  } catch (error) {
    console.error('Error get chat messages:', error)
    throw error
  }
}
