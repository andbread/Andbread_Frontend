import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { USER_STORE_KEY } from '@/lib/authStorage'
import type { User } from '@/types/user'
import { supabaseAnonKey, supabaseUrl } from './env'
import type { TestUser } from './seed'

export interface InjectedSession {
  /** 브라우저 localStorage에 그대로 넣을 supabase 세션 항목 */
  storage: Record<string, string>
  user: User
}

const memoryStorage = (entries: Record<string, string>) => ({
  getItem: (key: string) => (key in entries ? entries[key] : null),
  setItem: (key: string, value: string) => {
    entries[key] = value
  },
  removeItem: (key: string) => {
    delete entries[key]
  },
})

/**
 * 실제 Provider 로그인 화면은 우리 코드가 아니므로 자동화하지 않는다.
 * 대신 supabase 클라이언트를 메모리 저장소로 만들어 로그인시키고,
 * 라이브러리가 직접 기록한 세션 항목을 그대로 브라우저에 옮긴다.
 * 세션 직렬화 형식이 바뀌어도 테스트가 따라 깨지지 않는다.
 */
export const createSession = async (
  user: TestUser,
): Promise<InjectedSession> => {
  const entries: Record<string, string> = {}

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: memoryStorage(entries),
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (error) throw error

  return {
    storage: { ...entries },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      socialType: user.socialType,
      profileImage: user.profileImage,
      tag: Number(user.tag),
    },
  }
}

interface ApplySessionOptions {
  /**
   * ProtectRoute는 localStorage의 `user-store`로 로그인 여부를 판단한다.
   * 로그인 콜백처럼 앱이 직접 이 값을 채우는 흐름을 검증할 때는 false로 둔다.
   */
  withUserStore?: boolean
}

export const applySession = async (
  page: Page,
  session: InjectedSession,
  options: ApplySessionOptions = {},
) => {
  const payload = {
    entries: session.storage,
    userStoreKey: USER_STORE_KEY,
    userStoreValue:
      options.withUserStore === false
        ? null
        : JSON.stringify({ state: { user: session.user }, version: 0 }),
  }

  await page.addInitScript((data) => {
    try {
      for (const [key, value] of Object.entries(data.entries)) {
        // 앱이 토큰을 갱신한 뒤 다시 덮어쓰지 않도록 비어 있을 때만 넣는다.
        if (window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, value)
        }
      }

      if (
        data.userStoreValue !== null &&
        window.localStorage.getItem(data.userStoreKey) === null
      ) {
        window.localStorage.setItem(data.userStoreKey, data.userStoreValue)
      }
    } catch {
      // about:blank처럼 저장소를 쓸 수 없는 문맥에서는 넘어간다.
    }
  }, payload)
}

export const readUserStore = async (page: Page) => {
  const raw = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    USER_STORE_KEY,
  )

  if (!raw) return null

  return JSON.parse(raw) as { state?: { user?: User | null } }
}
