// hooks/useNotificationPermission.ts
import { useEffect, useState, useCallback, useMemo } from 'react'
import { getToken } from 'firebase/messaging'
import { initMessaging } from '@/utils/firebase/initFirebase'
import { registerServiceWorker } from '@/utils/registerServiceWorker'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

type PermissionState = NotificationPermission | 'unsupported'

export const useNotificationPermission = (userId: string | undefined) => {
  const [permissionState, setPermissionState] = useState<
    PermissionState | undefined
  >(undefined)
  const [showIOSPermissionModal, setShowIOSPermissionModal] =
    useState<boolean>(false)

  // 현재 접속 기기가 ios인지 확인
  const isiOS = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream
    )
  }, [])

  // OS 권한 상태 확인
  useEffect(() => {
    if (permissionState) return

    if (!('Notification' in window)) {
      setPermissionState('unsupported')
      return
    }
    setPermissionState(Notification.permission)
  }, [])

  // os에 따라 권한 요청 분기
  useEffect(() => {
    if (permissionState !== 'default' || !userId) return

    if (isiOS) {
      setShowIOSPermissionModal(true) // ios인 경우 모달 팝업
    } else {
      getPermissionAndRegisterToken() // 이외의 경우 바로 알림 권한 요청
    }
  }, [isiOS, permissionState])

  // 권한 요청 및 fcm 토큰 발급
  const getPermissionAndRegisterToken = useCallback(async () => {
    if (!('Notification' in window) || !userId) {
      setPermissionState('unsupported')
      return 'unsupported'
    }

    try {
      const registration = await registerServiceWorker()
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== 'granted') return permission

      const messaging = await initMessaging()
      const fcmDeviceToken = await getToken(messaging!, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (fcmDeviceToken) {
        await upsertFcmToken(userId, fcmDeviceToken)
        console.log('fcmDeviceToken', fcmDeviceToken)
      }
      return permission
    } catch (error) {
      console.error('알림 권한 요청 중 오류 발생:', error)
    }
  }, [userId])

  return {
    permissionState,
    showIOSPermissionModal,
    setShowIOSPermissionModal,
    getPermissionAndRegisterToken,
  }
}
