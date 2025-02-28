export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      nbread_records: {
        Row: {
          id: number
          is_paid: boolean
          nbread_id: string
          payment_date: string
          user_id: string
        }
        Insert: {
          id?: number
          is_paid?: boolean
          nbread_id: string
          payment_date: string
          user_id: string
        }
        Update: {
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
      user: {
        Row: {
          email: string
          id: string
          name: string
          profile_image: string | null
          social_type: string
        }
        Insert: {
          email: string
          id?: string
          name: string
          profile_image?: string | null
          social_type: string
        }
        Update: {
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          social_type?: string
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
