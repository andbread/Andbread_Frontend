import { apiRequest } from '@/lib/apiClient'
import { ChatMessage } from '@/types/chatMessage'
import type { ChatMessagePayload } from '@/lib/server/chatMessage/getChatMessages'
import { formatChatMessageTime } from '@/utils/formatChatMessageTime'

/* getChatMessages: 그룹 메시지 내역을 불러옴 */
export const getChatMessages = async (nbreadId: string) => {
  try {
    const messages = await apiRequest<ChatMessagePayload[]>(
      `/api/nbreads/${nbreadId}/messages`,
    )

    // formattedTime은 표시용 값이라 여기서 만든다.
    const chatMessages: ChatMessage[] = messages.map((message) => ({
      ...message,
      formattedTime: formatChatMessageTime(message.createdAt),
    }))

    return chatMessages
  } catch (error) {
    console.error('Error get chat messages:', error)
    throw error
  }
}
