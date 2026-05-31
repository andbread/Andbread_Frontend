export interface ChatMessage {
  id: string
  content: string
  nbreadId: string
  userId: string
  userName: string
  userProfileImage: string | null
  createdAt: string
  formattedTime: string
  status?: 'sending' | 'failed'
}
