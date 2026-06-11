'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { GA_EVENTS, trackEvent } from './events'

const PageViewTracker = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    trackEvent(GA_EVENTS.VIEW_PAGE, { path: pathname })
  }, [pathname])

  return null
}

export default PageViewTracker
