import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_KEY

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const

const requireEnv = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 서버 환경 변수가 설정되지 않았습니다.')
  }

  return { supabaseUrl, supabaseAnonKey }
}

/**
 * 사용자 JWT를 바인딩한 Supabase 클라이언트를 만든다.
 * anon key를 그대로 쓰므로 RLS는 브라우저에서 직접 호출할 때와 동일하게 적용된다.
 *
 * 반드시 요청마다 새로 만들어야 한다.
 * 모듈 최상위에서 만들어 재사용하면 서버리스 인스턴스가 재사용될 때
 * 다른 사용자의 토큰으로 쿼리가 나갈 수 있다.
 */
export const createRouteClient = (accessToken: string) => {
  const { supabaseUrl, supabaseAnonKey } = requireEnv()

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: authOptions,
  })
}

/**
 * 토큰을 바인딩하지 않은 anon 클라이언트를 만든다.
 * 인증이 선택적인 엔드포인트와 토큰 검증에만 쓴다.
 */
export const createAnonRouteClient = () => {
  const { supabaseUrl, supabaseAnonKey } = requireEnv()

  return createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions })
}
