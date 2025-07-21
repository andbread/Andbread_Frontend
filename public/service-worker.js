self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('푸시 알림 데이터 없음')
    return
  }

  const payload = event.data.json()
  const { title, body, icon, url } = payload

  const options = {
    body,
    icon: icon || '/pwa-icons/icon512_rounded.png',
    data: { url },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})
