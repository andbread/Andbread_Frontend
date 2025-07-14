export const requestNotificationPermission = () => {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('푸시 알림 권한이 허용됨')
      } else {
        console.log('푸시 알림 권한이 거부됨')
      }
    })
  }
}

export const sendPushNotification = (title: string, body: string) => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/icons/favicon/favicon-16x16.png',
      })
    })
  }
}
