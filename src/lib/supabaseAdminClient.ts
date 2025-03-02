import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string
const supabaseServiceRoleKey = process.env
  .NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseServiceRoleKey) {
  console.error('환경 변수가 올바르게 설정되지 않았습니다.')
}

export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey)
