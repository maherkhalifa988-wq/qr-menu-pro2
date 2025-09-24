
'use client'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { app } from '@/lib/firebase'

export async function signInWithPasscode(code: string): Promise<'admin' | 'editor'> {
  const pass = (code ?? '').trim()
  if (!pass) throw new Error('EMPTY_CODE')

  const url = new URL('/api/passcode', location.origin)
  url.searchParams.set('code', pass)

  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error('PASSCODE_HTTP_${res.status}: ${text}')
  }

  const data = await res.json()
  const token: string | undefined = data.token   // إن كنت تعيد توكين
  const role: 'admin' | 'editor' = data.role

  // إن عندك توكين Firebase:
  if (token) {
    const auth = getAuth(app)
    await signInWithCustomToken(auth, token)
   await auth.currentUser?.getIdToken(true)
  }

  return role
}
