import { initializeApp } from 'firebase/app'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'project-nbread.firebaseapp.com',
  projectId: 'project-nbread',
  storageBucket: 'project-nbread.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const setupMessaging = async () => {
  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.')
    return null
  }

  const messaging = getMessaging()
  return messaging
}

const app = initializeApp(firebaseConfig)

// messaging을 외부에서 초기화하게 export
const initMessaging = async () => {
  if (typeof window === 'undefined') return null

  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.')
    return null
  }

  return getMessaging()
}

export { app, initMessaging }
