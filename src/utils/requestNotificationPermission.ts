import { useToast } from '@/components/common/toast/Toast'
import { registerServiceWorker } from './registerServiceWorker'
import { getToken } from 'firebase/messaging'
import { messaging } from './firebase/initFirebase'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

export const requestNotificationPermission = async (userId: string) => {
  // if ('Notification' in window) {
  try {
    const registration = await registerServiceWorker()
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      // TODO 알림이 허용되지 않았다는 안내 UI 추가 필요
      throw new Error('알림이 허용되지 않음')
    }

    const fcmDeviceToken = await getToken(messaging!, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    console.log(fcmDeviceToken)

    if (fcmDeviceToken) {
      // TODO fcm 디바이스 토큰을 서버에 저장
      const data = upsertFcmToken(userId, fcmDeviceToken)
      console.log(data)
    }
  } catch (error) {
    console.error('알림 허용 요청 중 오류 발생: ', error)
    throw error
  }
  // }
}
