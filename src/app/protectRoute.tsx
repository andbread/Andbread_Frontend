'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LoginConfirmModal from '@/components/common/Modal/LoginConfirmModal'
import Toast from '@/components/common/toast/Toast'

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
  const user = sessionStorage.getItem('user-store')

  useEffect(() => {
    if (!user && !publicRoutes.includes(pathname)) {
      setIsLoginConfirmModalOpen(true)
    }
  }, [pathname])

  return (
    <>
      <Toast />
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
