'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasPersistedUser } from '@/lib/authStorage'

interface LoginRedirectGuardProps {
  children: React.ReactNode
}

const LoginRedirectGuard = ({ children }: LoginRedirectGuardProps) => {
  const router = useRouter()
  const [shouldRenderLogin, setShouldRenderLogin] = useState(false)

  useEffect(() => {
    if (hasPersistedUser()) {
      router.replace('/home')
      return
    }

    setShouldRenderLogin(true)
  }, [router])

  if (!shouldRenderLogin) {
    return null
  }

  return children
}

export default LoginRedirectGuard
