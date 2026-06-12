'use client' // 클라이언트 전용 코드

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string

const authConfig =
  typeof window !== 'undefined'
    ? {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    : {}

export const supabase = createClient(supabaseUrl, supabaseKey, authConfig)
