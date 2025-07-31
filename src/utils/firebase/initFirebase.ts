import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'project-nbread.firebaseapp.com',
  projectId: 'project-nbread',
  storageBucket: 'project-nbread.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
let messaging: ReturnType<typeof getMessaging> | null = null

// 브라우저 환경에서만 messaging 초기화
if (typeof window !== 'undefined') {
  messaging = getMessaging(app)
}

export { app, messaging }
