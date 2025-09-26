// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars')
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

export const adminDb = admin.firestore()
