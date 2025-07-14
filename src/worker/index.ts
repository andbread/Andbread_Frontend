/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

// TypeScript가 self를 인식하도록 설정
declare let self: ServiceWorkerGlobalScope

// __WB_MANIFEST는 workbox가 컴파일 시 자동 삽입
precacheAndRoute(self.__WB_MANIFEST)

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker 등록 성공:', registration)
        })
        .catch((error) => {
          console.log('Service Worker 등록 실패:', error)
        })
    })
  }
}
