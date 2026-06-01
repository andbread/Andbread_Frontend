import { supabase } from './supabaseClient'
import { LoginProvider } from '@/types/user'
import useUserStore from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/common/toast/Toast'
import { captureAppError } from '@/lib/sentry/sentry'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'

// 1. 로그인 함수
export const login = async (provider: LoginProvider['provider']) => {
  const appUrl =
    (typeof window !== 'undefined' ? window.location.origin : undefined) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000')
  const redirectToUrl = `${appUrl}/auth/callback`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectToUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    captureAppError(error, {
      action: 'auth.login',
      tags: { provider },
    })
    throw new Error(error.message)
  }

  return data
}

// 2. 로그아웃 함수
export const logout = async (router: ReturnType<typeof useRouter>) => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    captureAppError(error, {
      action: 'auth.logout',
    })
  }
  useUserStore.getState().clearUser()
  sessionStorage.clear()
  trackEvent(GA_EVENTS.LOGOUT)
  setTimeout(() => {
    localStorage.clear()
    useToast.success('로그아웃이 완료되었어요.')
    router.replace('/login')
  }, 1000)
}

// 3. 계정 탈퇴 함수
export const deleteAccount = async (router: ReturnType<typeof useRouter>) => {
  const { data, error: sessionError } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  if (sessionError || !accessToken) {
    const error = sessionError ?? new Error('유저정보를 찾을수 없음')
    captureAppError(error, {
      action: 'auth.delete_account',
    })
    throw error
  }

  const response = await fetch('/api/auth/delete-account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    const error = new Error(result?.message ?? '회원 탈퇴에 실패했습니다.')
    captureAppError(error, {
      action: 'auth.delete_account',
      tags: { status: response.status },
    })
    throw error
  }

  await supabase.auth.signOut({ scope: 'local' })
  useUserStore.getState().clearUser()
  sessionStorage.removeItem('user-store')
  localStorage.clear()
  setTimeout(() => {
    useToast.success('회원 탈퇴가 완료되었어요.')
    router.replace('/login')
  }, 1000)
}

// 4. 유저 이름을 받아오는 함수
export const getUserName = async (leaderId: string) => {
  try {
    if (!leaderId) {
      return null
    }
    const { data, error } = await supabase
      .from('user')
      .select('name')
      .eq('id', leaderId)
      .single()
    if (error) {
      throw new Error(error.message)
    }

    // 데이터가 없으면 null 반환
    if (!data) {
      return null
    }

    // 사용자 이름 반환
    return data.name
  } catch {
    return null // 에러 발생 시 null 반환
  }
}

// 5. 유저 정보를 받아오는 함수
export const getUser = async (accessToken: string) => {
  const data = await supabase.auth.getUser(accessToken)

  return data
}
