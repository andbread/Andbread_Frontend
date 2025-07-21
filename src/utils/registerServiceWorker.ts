export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker 등록 성공:', registration)
      })
      .catch((error) => {
        console.log('Service Worker 등록 실패:', error)
      })
  }
}
