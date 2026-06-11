export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
      )
      console.log('service worker 등록 완료: ', registration)
      return registration
    } catch (error) {
      console.error('service worker 등록 실패: ', error)
      throw error
    }
  } else {
    console.log('service worker가 지원되지 않음')
    return Promise.reject('service worker가 지원되지 않음')
  }
}
