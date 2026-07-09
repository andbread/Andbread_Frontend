'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { setSentryUser } from '@/lib/sentry/sentry'
import useUserStore from '@/stores/useAuthStore'
import {
  getCurrentUserRow,
  hasRequiredTermsAgreement,
} from '@/lib/termsAgreement'
import { hasPersistedUser } from '@/lib/authStorage'

const publicRoutes = [
  '/',
  '/login',
  '/auth/callback',
  '/terms-agreement',
  '/terms-of-service',
  '/privacy-policy',
  '/ios-guide',
]
const termsAgreementExemptRoutes = [
  ...publicRoutes,
  '/terms-of-service',
  '/privacy-policy',
]

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useUserStore((state) => state.user)
  const [isRedirectingToLanding, setIsRedirectingToLanding] =
    useState<boolean>(false)

  useEffect(() => {
    setSentryUser(user ? { id: user.id } : null)
  }, [user])

  useEffect(() => {
    const hasStoredUser = hasPersistedUser()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isNotFoundPage = (window as any).__IS_NOT_FOUND_PAGE__
    // 토큰 초대 페이지는 로그인 전에도 초대 내용을 확인할 수 있는 공개 경로다.
    const isPublicRoute =
      publicRoutes.includes(pathname) || pathname.startsWith('/invite/')

    if (!hasStoredUser && !isPublicRoute && !isNotFoundPage) {
      setIsRedirectingToLanding(true)
      router.replace('/')
      return
    }

    setIsRedirectingToLanding(false)
  }, [pathname, router])

  useEffect(() => {
    if (!user?.id || termsAgreementExemptRoutes.includes(pathname)) return

    const redirectIfRequiredTermsNotAgreed = async () => {
      try {
        const userRow = await getCurrentUserRow(user.id)

        if (userRow && !hasRequiredTermsAgreement(userRow)) {
          router.replace('/terms-agreement')
        }
      } catch (error) {
        console.error('Error checking required terms agreement:', error)
      }
    }

    redirectIfRequiredTermsNotAgreed()
  }, [pathname, router, user?.id])

  return (
    <div className="min-h-[100svh]">
      {isRedirectingToLanding ? null : children}
    </div>
  )
}
