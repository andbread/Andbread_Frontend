import { getToken } from 'firebase/messaging'
import { initMessaging } from './initFirebase'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

// TODO getToken 요청 실패 시 최대 3회까지 재시도하도록 수정

export async function getFCMDeviceToken(
  userId: string,
  registration: ServiceWorkerRegistration,
) {
  const messaging = await initMessaging()
  const fcmDeviceToken = await getToken(messaging!, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (fcmDeviceToken) {
    upsertFcmToken(userId, fcmDeviceToken)
  }
}
