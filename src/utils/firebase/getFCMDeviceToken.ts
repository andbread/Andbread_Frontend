import { getToken } from 'firebase/messaging'
import { messaging } from './initFirebase'
import { upsertFcmToken } from '@/lib/fcmToken/upsertFcmToken'

export async function getFCMDeviceToken(
  userId: string,
  registration: ServiceWorkerRegistration,
) {
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
