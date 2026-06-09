'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'
import { supabase } from '@/lib/supabaseClient'
import { GA_EVENTS, trackEvent } from '@/lib/analytics/events'
import { getInternalRedirectPath } from '@/lib/authRedirect'
import useUserStore from '@/stores/useAuthStore'
import {
  getCurrentUserRow,
  hasRequiredTermsAgreement,
  toUserStoreValue,
} from '@/lib/termsAgreement'

NProgress.configure({ showSpinner: false })

export const useAuthCallbackFlow = (next: string | null) => {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const setUser = useUserStore((state) => state.setUser)
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        NProgress.start()

        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          throw error ?? new Error('로그인 정보를 찾을 수 없습니다.')
        }

        const userRow = await getCurrentUserRow(data.user.id)

        if (!userRow) {
          throw new Error(
            '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
          )
        }

        const userInfo = toUserStoreValue(data.user, userRow)
        setUser(userInfo)
        trackEvent(GA_EVENTS.SIGN_IN, { provider: userInfo.socialType })
        localStorage.clear()

        if (hasRequiredTermsAgreement(userRow)) {
          // 세션과 사용자 정보 저장이 끝난 뒤 로그인 전 페이지로 복귀한다.
          router.replace(getInternalRedirectPath(next))
          return
        }

        const redirectPath = getInternalRedirectPath(next)
        router.replace(
          `/terms-agreement?next=${encodeURIComponent(redirectPath)}`,
        )
      } catch (error) {
        console.error('Error handling auth callback:', error)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '로그인 처리 중 문제가 발생했습니다.',
        )
      } finally {
        setLoading(false)
        NProgress.done()
      }
    }

    handleAuthCallback()
  }, [next, router, setUser])

  return { loading, errorMessage }
}
