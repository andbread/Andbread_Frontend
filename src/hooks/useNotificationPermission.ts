// hooks/useNotificationPermission.ts
import { useEffect, useState, useCallback, useMemo } from 'react'
import { getToken } from 'firebase/messaging'
import { initMessaging } from '@/utils/firebase/initFirebase'
import { registerServiceWorker } from '@/utils/registerServiceWorker'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

type PermissionState = NotificationPermission | 'unsupported'

export const useNotificationPermission = (
  userId: string | undefined,
  options: { autoRequest?: boolean } = {},
) => {
  const { autoRequest = true } = options
  const [permissionState, setPermissionState] = useState<
    PermissionState | undefined
  >(undefined)
  const [showIOSPermissionModal, setShowIOSPermissionModal] =
    useState<boolean>(false)
  const [showIOSGuideModal, setShowIOSGuideModal] = useState<boolean>(false)

  // 현재 접속 기기가 ios인지 확인
  const isiOS = useMemo(() => {
    if (typeof window === 'undefined') return false

    const userAgent = navigator.userAgent
    const isIPadOS =
      navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

    return (
      (/iPad|iPhone|iPod/.test(userAgent) || isIPadOS) &&
      !window.MSStream
    )
  }, [])

  const isIOSSafari = useMemo(() => {
    if (typeof window === 'undefined') return false

    const userAgent = navigator.userAgent
    const isSafari = /safari/i.test(userAgent)
    const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)

    return isiOS && isSafari && !isOtherIOSBrowser
  }, [isiOS])

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  }, [])

  const shouldShowIOSGuide = isIOSSafari && !isStandalone

  // OS 권한 상태 확인
  useEffect(() => {
    if (permissionState) return

    if (shouldShowIOSGuide) {
      setPermissionState('unsupported')

      if (autoRequest && userId) {
        setShowIOSGuideModal(true)
      }
      return
    }

    if (!('Notification' in window)) {
      setPermissionState('unsupported')
      return
    }
    setPermissionState(Notification.permission)
  }, [autoRequest, permissionState, shouldShowIOSGuide, userId])

  // fcm 토큰 발급 및 서버 저장
  const getFcmTokenAndRegister = useCallback(
    async (userId: string) => {
      try {
        const registration = await registerServiceWorker()
        const messaging = await initMessaging()

        const fcmDeviceToken = await getToken(messaging!, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (fcmDeviceToken) {
          await upsertFcmToken(userId, fcmDeviceToken)
          console.log('[FCM] device token:', fcmDeviceToken)
        }
      } catch (error) {
        console.error('알림 권한 요청 중 오류 발생:', error)
      }
    },
    [userId],
  )

  // 권한 요청
  const requestPermission = useCallback(async () => {
    if (shouldShowIOSGuide) {
      setShowIOSGuideModal(true)
      setPermissionState('unsupported')
      return 'unsupported'
    }

    if (!('Notification' in window)) {
      setPermissionState('unsupported')
      return 'unsupported'
    }

    const permission = await Notification.requestPermission()
    setPermissionState(permission)

    // 권한 허용 시 fcm 토큰 발급 및 서버 저장
    if (permission === 'granted' && userId) {
      await getFcmTokenAndRegister(userId)
    }
    return permission
  }, [getFcmTokenAndRegister, shouldShowIOSGuide, userId])

  // os에 따라 권한 요청 분기
  useEffect(() => {
    if (!autoRequest) return
    if (permissionState !== 'default' || !userId) return

    if (shouldShowIOSGuide) {
      setShowIOSGuideModal(true)
      return
    }

    if (isiOS) {
      setShowIOSPermissionModal(true) // ios인 경우 모달 팝업
    } else {
      requestPermission() // 이외의 경우 바로 알림 권한 요청
    }
  }, [
    autoRequest,
    isiOS,
    permissionState,
    requestPermission,
    shouldShowIOSGuide,
    userId,
  ])

  useEffect(() => {
    if (permissionState !== 'granted' || !userId) return

    getFcmTokenAndRegister(userId)
  }, [getFcmTokenAndRegister, permissionState, userId])

  return {
    permissionState,
    showIOSPermissionModal,
    setShowIOSPermissionModal,
    showIOSGuideModal,
    setShowIOSGuideModal,
    shouldShowIOSGuide,
    requestPermission,
  }
}
