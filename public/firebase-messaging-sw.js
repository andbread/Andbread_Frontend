/* 푸시 알림 이벤트 리스너 */
self.addEventListener('push', function (e) {
  if (!e.data.json()) return

  console.log(e.data.json())
  const resultData = e.data.json().notification
  const notificationTitle = resultData.title
  const notificationOptions = {
    body: resultData.body,
    icon: '/pwa-icons/icon512_rounded.png',
  }
  console.log('푸시 알림: ', {
    resultData,
    notificationTitle,
    notificationOptions,
  })

  self.registration.showNotification(notificationTitle, notificationOptions)
})

/* 알림 클릭 이벤트 리스너 */
// self.addEventListener('notificationclick', function (event) {
//   console.log('notification click');
//   const url = '/alarm';
//   event.notification.close();
//   event.waitUntil(clients.openWindow(url));
// });
