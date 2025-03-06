'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoginConfirmModal from '@/components/common/Modal/LoginConfirmModal'

const publicRoutes = ['/login', '/auth/callback', 'inviteAccept']

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoginConfirmModalOpen, setIsLoginConfirmModalOpen] =
    useState<boolean>(false)

  useEffect(() => {
    const user = sessionStorage.getItem('user-store')
    const isNotFoundPage = (window as any).__IS_NOT_FOUND_PAGE__
    if (!user && !publicRoutes.includes(pathname) && !isNotFoundPage) {
      setIsLoginConfirmModalOpen(true)
    }
  }, [pathname])

  return (
    <>
      {children}
      <LoginConfirmModal
        isOpen={isLoginConfirmModalOpen}
        onClose={() => setIsLoginConfirmModalOpen(false)}
        onSubmit={() => {
          router.replace('/login')
          setIsLoginConfirmModalOpen(false)
        }}
      />
    </>
  )
}
