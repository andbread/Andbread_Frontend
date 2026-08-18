'use client' // 브라우저에서 app/api를 호출하는 전용 클라이언트

import { supabase } from '@/lib/supabaseClient'
import useUserStore from '@/stores/useAuthStore'
import { clearLegacyAuthStorage } from '@/lib/authStorage'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export type QueryValue = string | number | boolean | undefined | null

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
}

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  if (!query) return path

  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * 재시도까지 실패한 401은 세션이 살아날 수 없는 상태로 본다.
 * 로컬 세션과 스토어만 비우고 화면 이동은 하지 않는다.
 *
 * 이동까지 여기서 처리하면 protectRoute의 판정과 경쟁한다.
 * 배경 요청 하나가 실패했다고 사용자를 페이지 밖으로 밀어내지 않도록,
 * 어디로 보낼지는 기존대로 protectRoute가 결정하게 둔다.
 */
const clearDeadSession = async () => {
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  useUserStore.getState().clearUser()
  clearLegacyAuthStorage()
}

const parseErrorMessage = async (response: Response) => {
  const result = (await response.json().catch(() => null)) as {
    message?: string
    code?: string
  } | null

  return {
    message: result?.message ?? `요청에 실패했습니다. (${response.status})`,
    code: result?.code,
  }
}

const send = async (
  url: string,
  method: string,
  body: unknown,
  accessToken: string | null,
) => {
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return fetch(url, {
    method,
    headers,
    cache: 'no-store',
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

/**
 * app/api Route Handler를 호출한다.
 * 성공 응답의 { data }를 벗겨서 돌려주고, 204는 undefined를 돌려준다.
 * 실패하면 ApiError를 던진다.
 *
 * 세션이 있으면 항상 토큰을 붙인다.
 * 인증이 선택인 엔드포인트도 마찬가지다. 로그인 상태에서 토큰을 빼면
 * 서버가 anon으로 조회해 RLS에 막히므로 로그인 전과 같은 결과만 보게 된다.
 */
export const apiRequest = async <T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { method = 'GET', body, query } = options
  const url = buildUrl(path, query)

  let accessToken = await getAccessToken()
  let response = await send(url, method, body, accessToken)

  // 토큰 만료로 401을 받으면 세션을 갱신해 1회만 재시도한다.
  if (response.status === 401) {
    const { data } = await supabase.auth.refreshSession()
    const refreshedToken = data.session?.access_token ?? null

    if (refreshedToken && refreshedToken !== accessToken) {
      accessToken = refreshedToken
      response = await send(url, method, body, accessToken)
    }

    if (response.status === 401) {
      await clearDeadSession()
      const { message, code } = await parseErrorMessage(response)
      throw new ApiError(401, message, code)
    }
  }

  if (!response.ok) {
    const { message, code } = await parseErrorMessage(response)
    throw new ApiError(response.status, message, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const result = (await response.json()) as { data: T }
  return result.data
}
