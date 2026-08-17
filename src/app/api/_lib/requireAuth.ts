import type { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { fail } from './response'
import {
  createAnonRouteClient,
  createRouteClient,
} from './supabaseRouteClient'

export type AuthResult =
  | { ok: true; user: User; client: SupabaseClient }
  | { ok: false; response: NextResponse }

const parseBearerToken = (request: Request) => {
  const authorization = request.headers.get('authorization')

  return authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null
}

/**
 * Authorization 헤더의 Bearer 토큰을 검증하고
 * 그 토큰을 바인딩한 Supabase 클라이언트를 함께 돌려준다.
 */
export const requireAuth = async (request: Request): Promise<AuthResult> => {
  const accessToken = parseBearerToken(request)

  if (!accessToken) {
    return { ok: false, response: fail(401, '인증 토큰이 없습니다.') }
  }

  let client: SupabaseClient

  try {
    client = createRouteClient(accessToken)
  } catch {
    return {
      ok: false,
      response: fail(500, 'Supabase 서버 환경 변수가 설정되지 않았습니다.'),
    }
  }

  const {
    data: { user },
    error,
  } = await createAnonRouteClient().auth.getUser(accessToken)

  if (error || !user) {
    return { ok: false, response: fail(401, '유효하지 않은 인증 토큰입니다.') }
  }

  return { ok: true, user, client }
}
