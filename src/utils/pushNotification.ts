import { useToast } from '@/components/common/toast/Toast'
import { upsertSubscribe } from '@/lib/pushSubscribe/upsertPushSubscribe'

export const requestNotificationPermission = (userId: string) => {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('푸시 알림 권한이 허용됨')
        subscribePushNotification(userId)
      } else {
        console.log('푸시 알림을 허용해주세요')
      }
    })
  }
}

export const sendTestPushNotification = (title: string, body: string) => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/pwa-icons/icon512_rounded.png',
      })
    })
  }
}

export const subscribePushNotification = async (userId: string) => {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    ),
  })

  const { endpoint, keys } = subscription.toJSON()
  if (endpoint && keys) {
    upsertSubscribe(userId, endpoint, keys)
  } else {
    useToast.error('알림 허용에 실패했어요. 다시 시도해주세요.')
  }
}

// VAPID 키 디코딩
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
