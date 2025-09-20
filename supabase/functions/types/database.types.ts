export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)'
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          nbread_id: string
          user_id: string | null
          user_name: string
          user_profile_image: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          nbread_id: string
          user_id?: string | null
          user_name: string
          user_profile_image?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          nbread_id?: string
          user_id?: string | null
          user_name?: string
          user_profile_image?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_nbread_id_fkey'
            columns: ['nbread_id']
            isOneToOne: false
            referencedRelation: 'nbread'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chat_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      fcm_token: {
        Row: {
          created_at: string
          fcm_token: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fcm_token: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          fcm_token?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'push_subscription_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      nbread: {
        Row: {
          amount: number
          current_payment_date: string | null
          id: string
          leader_id: string
          next_payment_date: string | null
          participant_count: number
          payment_date: number
          payment_month: number | null
          payment_period: string
          title: string
        }
        Insert: {
          amount: number
          current_payment_date?: string | null
          id?: string
          leader_id: string
          next_payment_date?: string | null
          participant_count: number
          payment_date: number
          payment_month?: number | null
          payment_period: string
          title: string
        }
        Update: {
          amount?: number
          current_payment_date?: string | null
          id?: string
          leader_id?: string
          next_payment_date?: string | null
          participant_count?: number
          payment_date?: number
          payment_month?: number | null
          payment_period?: string
          title?: string
        }
        Relationships: []
      }
      nbread_invite: {
        Row: {
          created_at: string
          id: string
          invited_user_id: string
          nbread_id: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          nbread_id: string
          state: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          nbread_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nbread_invite_invited_user_id_fkey'
            columns: ['invited_user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nbread_invite_nbread_id_fkey'
            columns: ['nbread_id']
            isOneToOne: false
            referencedRelation: 'nbread'
            referencedColumns: ['id']
          },
        ]
      }
      nbread_records: {
        Row: {
          created_at: string | null
          id: number
          is_paid: boolean
          nbread_id: string
          payment_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_paid?: boolean
          nbread_id: string
          payment_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_paid?: boolean
          nbread_id?: string
          payment_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nbread_records_nbread_id_fkey'
            columns: ['nbread_id']
            isOneToOne: false
            referencedRelation: 'nbread'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nbread_records_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      notification: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          message: string
          title: string
          type: string
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_read: boolean
          message: string
          title: string
          type: string
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notification_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      participant: {
        Row: {
          id: number
          is_leader: boolean
          nbread_id: string
          user_id: string
        }
        Insert: {
          id?: number
          is_leader: boolean
          nbread_id: string
          user_id: string
        }
        Update: {
          id?: number
          is_leader?: boolean
          nbread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nbread_user_nbread_id_fkey'
            columns: ['nbread_id']
            isOneToOne: false
            referencedRelation: 'nbread'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nbread_user_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      post: {
        Row: {
          content: string | null
          created_at: string
          id: number
          profile_image: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          profile_image?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          profile_image?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'post_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user'
            referencedColumns: ['id']
          },
        ]
      }
      user: {
        Row: {
          email: string
          id: string
          name: string
          profile_image: string | null
          social_type: string
          tag: string
        }
        Insert: {
          email: string
          id?: string
          name: string
          profile_image?: string | null
          social_type: string
          tag: string
        }
        Update: {
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          social_type?: string
          tag?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_nbread_records: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_payment_dates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserRow = Database['public']['Tables']['user']['Row']
export type ParticipantRow = Database['public']['Tables']['participant']['Row']
export type NbreadRow = Database['public']['Tables']['nbread']['Row']
export type NbreadRecordsRow =
  Database['public']['Tables']['nbread_records']['Row']
export type NotificationRow =
  Database['public']['Tables']['notification']['Row']
export type ChatMessageRow =
  Database['public']['Tables']['chat_messages']['Row']
export type FriendRequestRow =
  Database['public']['Tables']['friend_request']['Row']
