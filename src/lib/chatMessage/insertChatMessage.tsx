import { apiRequest } from '@/lib/apiClient'
import { ChatMessage } from '@/types/chatMessage'
import type { ChatMessagePayload } from '@/lib/server/chatMessage/getChatMessages'
import { User } from '@/types/user'
import { formatChatMessageTime } from '@/utils/formatChatMessageTime'

export const insertChatMessage = async (
  user: User,
  nbreadId: string,
  content: string,
): Promise<ChatMessage> => {
  const message = await apiRequest<ChatMessagePayload>(
    `/api/nbreads/${nbreadId}/messages`,
    {
      method: 'POST',
      body: {
        content,
        userName: user.name,
        userProfileImage: user.profileImage,
      },
    },
  )

  return {
    ...message,
    formattedTime: formatChatMessageTime(message.createdAt),
  }
}
