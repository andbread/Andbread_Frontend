import { registerServiceWorker } from './registerServiceWorker'
import { getToken } from 'firebase/messaging'
import { initMessaging } from './firebase/initFirebase'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

const registerFcmToken = async (userId: string) => {
  const registration = await registerServiceWorker()
  const messaging = await initMessaging()

  if (!messaging) return

  const fcmDeviceToken = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (fcmDeviceToken) {
    await upsertFcmToken(userId, fcmDeviceToken)
  }
}

export const requestNotificationPermission = async (userId: string) => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
          // TODO 알림이 허용되지 않았다는 안내 UI 추가 필요
          throw new Error('알림이 허용되지 않음')
        }

        await registerFcmToken(userId)
      } catch (error) {
        console.error('알림 허용 요청 중 오류 발생: ', error)
        throw error
      }
    } else if (Notification.permission === 'granted') {
      await registerFcmToken(userId)
    }
  } else {
    // TODO 알림 관련 팝업 UI 구현 필요
    console.error('알림을 받을 수 없는 환경')
  }
}
