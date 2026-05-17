import { Json } from './database.types.ts'

export interface Notification {
  user_id: string
  title: string
  message: string
  is_read: boolean
  type:
    | 'payment'
    | 'chat'
    | 'invite'
    | 'invite_accept'
    | 'friend_request'
    | 'friend_response'
  data: Json
}

export type TableRecord<T> = T

export type InsertPayload<T> = {
  type: 'INSERT'
  table: string
  schema: string
  record: TableRecord<T>
  old_record: null
}
export type UpdatePayload<T> = {
  type: 'UPDATE'
  table: string
  schema: string
  record: TableRecord<T>
  old_record: TableRecord<T>
}
