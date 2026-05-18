import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabasePublishableKey = process.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabasePublishableKey) {
  console.error('환경 변수가 올바르게 설정되지 않았습니다.')
}

export const adminSupabase = createClient(supabaseUrl, supabasePublishableKey)
