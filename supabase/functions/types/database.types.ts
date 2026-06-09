export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
      friend: {
        Row: {
          created_at: string
          id: number
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
      }
      friend_request: {
        Row: {
          created_at: string
          id: number
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: number
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: number
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      nbread: {
        Row: {
          amount: number
          end_date: string | null
          id: string
          leader_id: string
          participant_count: number
          payment_date: number
          payment_month: number | null
          payment_period: string
          start_date: string | null
          title: string
        }
        Insert: {
          amount: number
          end_date?: string | null
          id?: string
          leader_id: string
          participant_count: number
          payment_date: number
          payment_month?: number | null
          payment_period: string
          start_date?: string | null
          title: string
        }
        Update: {
          amount?: number
          end_date?: string | null
          id?: string
          leader_id?: string
          participant_count?: number
          payment_date?: number
          payment_month?: number | null
          payment_period?: string
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      nbread_invite: {
        Row: {
          created_at: string
          id: string
          invite_token: string
          nbread_id: string
          status: string
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string
          nbread_id: string
          status?: string
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string
          nbread_id?: string
          status?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'nbread_invite_invited_user_id_fkey'
            columns: ['target_user_id']
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
      nbread_auto_generation_logs: {
        Row: {
          created_at: string
          end_date: string | null
          error_message: string | null
          id: number
          inserted_count: number
          metadata: Json
          nbread_id: string | null
          next_payment_date: string | null
          payment_date: string | null
          reason: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          error_message?: string | null
          id?: number
          inserted_count?: number
          metadata?: Json
          nbread_id?: string | null
          next_payment_date?: string | null
          payment_date?: string | null
          reason?: string | null
          start_date?: string | null
          status: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          error_message?: string | null
          id?: number
          inserted_count?: number
          metadata?: Json
          nbread_id?: string | null
          next_payment_date?: string | null
          payment_date?: string | null
          reason?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nbread_auto_generation_logs_nbread_id_fkey'
            columns: ['nbread_id']
            isOneToOne: false
            referencedRelation: 'nbread'
            referencedColumns: ['id']
          },
        ]
      }
      notification: {
        Row: {
          created_at: string
          data: Json | null
          id: number
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: number
          is_read: boolean
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: number
          is_read?: boolean
          message?: string
          title?: string
          type?: string
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
          nbread_id: string
          profile_image: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          nbread_id: string
          profile_image?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          nbread_id?: string
          profile_image?: string | null
          user_id?: string | null
          user_name?: string | null
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
          privacy_agreed: boolean
          privacy_agreed_at: string | null
          privacy_version: string | null
          profile_image: string | null
          social_type: string
          tag: string
          terms_agreed: boolean
          terms_agreed_at: string | null
          terms_version: string | null
        }
        Insert: {
          email: string
          id?: string
          name: string
          privacy_agreed?: boolean
          privacy_agreed_at?: string | null
          privacy_version?: string | null
          profile_image?: string | null
          social_type: string
          tag: string
          terms_agreed?: boolean
          terms_agreed_at?: string | null
          terms_version?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string
          privacy_agreed?: boolean
          privacy_agreed_at?: string | null
          privacy_version?: string | null
          profile_image?: string | null
          social_type?: string
          tag?: string
          terms_agreed?: boolean
          terms_agreed_at?: string | null
          terms_version?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_nbread_payment_date: {
        Args: {
          p_payment_date: string
          p_payment_period: string
          p_payment_month: number
          p_payment_day: number
        }
        Returns: string
      }
      generate_nbread_records_for_due_group: {
        Args: {
          p_nbread_id: string
          p_today?: string
        }
        Returns: Json
      }
      respond_to_nbread_invite: {
        Args: {
          p_invite_token: string
          p_response: string
        }
        Returns: Json
      }
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
export type NbreadInviteRow =
  Database['public']['Tables']['nbread_invite']['Row']
export type NbreadRecordsRow =
  Database['public']['Tables']['nbread_records']['Row']
export type NotificationRow =
  Database['public']['Tables']['notification']['Row']
export type FriendRequestRow =
  Database['public']['Tables']['friend_request']['Row']
export type ChatMessageRow =
  Database['public']['Tables']['chat_messages']['Row']
