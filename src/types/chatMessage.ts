export interface ChatMessage {
  id: string
  content: string
  nbreadId: string
  userId: string
  userName: string
  userProfileImage: string | null
  createdAt: string
  status?: 'sending' | 'failed'
}
