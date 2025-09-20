export interface Notification {
  id: number
  user_id: string
  created_at: string
  title: string
  message: string
  url: string | null
  is_read: boolean
  type: string // TODO 알림 타입 수정 필요
}
