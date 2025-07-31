import { getToken } from 'firebase/messaging'
import { initMessaging } from './initFirebase'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

export async function getFCMDeviceToken(
  userId: string,
  registration: ServiceWorkerRegistration,
) {
  const messaging = await initMessaging()
  const fcmDeviceToken = await getToken(messaging!, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  console.log(fcmDeviceToken)

  if (fcmDeviceToken) {
    const data = upsertFcmToken(userId, fcmDeviceToken)
    console.log(data)
  }
}
