'use client' // 클라이언트 전용 코드

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string

// 클라이언트 환경인지 확인 후 sessionStorage 사용
const authConfig =
  typeof window !== 'undefined'
    ? {
        auth: {
          storage: sessionStorage, // 클라이언트에서만 사용
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    : {}

export const supabase = createClient(supabaseUrl, supabaseKey, authConfig)

// 클라이언트에서만 auth 상태 변화를 처리
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // 사용자가 로그인했을 때, sessionStorage에 토큰 저장
      sessionStorage.setItem('access_token', session.access_token)
    } else if (event === 'SIGNED_OUT') {
      // 로그아웃시 토큰 삭제
      sessionStorage.removeItem('access_token')
    }
  })
}
