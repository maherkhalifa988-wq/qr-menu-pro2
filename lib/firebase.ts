// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// تفعيل auto long-polling لحل مشاكل الشبكات التي تسبب unavailable
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  // experimentalForceLongPolling: true, // إن أردت إجبار long-polling (اختياري)
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const auth = getAuth(app)

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    console.log('👤 Auth user:', user?.uid)
  })
}

export async function ensureSignedIn() {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
}
