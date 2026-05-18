import { supabase } from './supabaseClient'
import { adminSupabase } from './supabaseAdminClient'
import { LoginProvider, User } from '@/types/user'
import useUserStore from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/common/toast/Toast'
import { captureAppError } from '@/lib/sentry'

// 1. 로그인 함수
export const login = async (provider: LoginProvider['provider']) => {
  const redirectToUrl = process.env.NEXT_PUBLIC_REDIRECT_URL
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
  setTimeout(() => {
    localStorage.clear()
    useToast.success('로그아웃이 완료되었어요.')
    router.replace('/login')
  }, 1000)
}

// 3. 계정 탈퇴 함수
export const deleteAccount = async (router: ReturnType<typeof useRouter>) => {
  const data = await supabase.auth.getUser()
  const user = data.data.user?.id
  if (!user) {
    const error = new Error('유저정보를 찾을수 없음')
    captureAppError(error, {
      action: 'auth.delete_account',
    })
    throw error
  }
  const { error } = await adminSupabase.auth.admin.deleteUser(user)
  if (error) {
    captureAppError(error, {
      action: 'auth.delete_account',
      tags: { userId: user },
    })
    throw error
  }
  await supabase.auth.signOut()
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
  } catch (error) {
    return null // 에러 발생 시 null 반환
  }
}

// 5. 유저 정보를 받아오는 함수
export const getUser = async (accessToken: string) => {
  const data = await supabase.auth.getUser(accessToken)

  return data
}
