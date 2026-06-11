import { Json } from './supabase'

export type NotificationType =
  | 'payment'
  | 'chat'
  | 'invite'
  | 'invite_accept'
  | 'friend_request'
  | 'friend_response'

export interface Notification {
  id: number
  user_id: string
  created_at: string
  title: string
  message: string
  data: Json | null
  is_read: boolean
  type: NotificationType
}
