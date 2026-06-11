'use client'

import { useEffect, useRef } from 'react'
import Clarity from '@microsoft/clarity'
import useUserStore from '@/stores/useAuthStore'

const ClarityProvider = () => {
  const user = useUserStore((state) => state.user)
  const isInitialized = useRef(false)
  const lastIdentifiedUserId = useRef<string | null>(null)
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

  useEffect(() => {
    if (!projectId || isInitialized.current) return
    Clarity.init(projectId)
    isInitialized.current = true
  }, [projectId])

  useEffect(() => {
    if (!projectId || !user?.id) return
    if (lastIdentifiedUserId.current === user.id) return

    Clarity.identify(user.id)
    lastIdentifiedUserId.current = user.id
  }, [projectId, user?.id])

  return null
}

export default ClarityProvider
