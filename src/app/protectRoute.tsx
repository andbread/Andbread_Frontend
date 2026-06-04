'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoginConfirmModal from '@/components/common/modal/LoginConfirmModal'
import { setSentryUser } from '@/lib/sentry/sentry'
import useUserStore from '@/stores/useAuthStore'
import {
  getCurrentUserRow,
  hasRequiredTermsAgreement,
} from '@/lib/termsAgreement'

const publicRoutes = [
  '/login',
  '/auth/callback',
  '/inviteAccept',
  '/terms-agreement',
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
  const [isProtectedRoute, setIsProtectedRoute] = useState<boolean>(false)

  useEffect(() => {
    setSentryUser(user ? { id: user.id } : null)
  }, [user])

  useEffect(() => {
    const user = sessionStorage.getItem('user-store')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isNotFoundPage = (window as any).__IS_NOT_FOUND_PAGE__
    if (!user && !publicRoutes.includes(pathname) && !isNotFoundPage) {
      setIsProtectedRoute(true)
    }
  }, [pathname])

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
      {children}
      <LoginConfirmModal
        isOpen={isProtectedRoute}
        onClose={() => setIsProtectedRoute(false)}
        onSubmit={() => {
          router.replace('/login')
          setIsProtectedRoute(false)
        }}
      />
    </div>
  )
}
