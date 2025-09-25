// app/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithPasscode } from '@/lib/authClient'

export default function Home() {
  const [rid, setRid] = useState('al-nakheel')
  const router = useRouter()

  async function handleGo(path: string) {
    try {
      const pass = window.prompt('🛡 أدخل كلمة السر للدخول')?.trim() ?? ''
      if (!pass) return
      await signInWithPasscode(pass)
      router.push(path)
    } catch (err: any) {
      console.error('LOGIN_ERROR', err)
      alert(`فشل الدخول: ${err?.message ?? err}`)
    }
  }

  return (
    <main className="container mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold mb-2">QR Menu Pro (Cloudinary)</h1>
        <p className="text-white/70">حول قائمة مطعمك إلى تجربة رقمية رائعة</p>
      </header>

      <section className="card p-5 mb-6">
        <h2 className="font-bold mb-3">اختبر صفحة الزبون</h2>
        <div className="flex gap-2">
          <input
            className="input"
            value={rid}
            onChange={(e) => setRid(e.target.value)}
            placeholder="restaurant-id"
          />
          <Link className="btn whitespace-nowrap" href={`/r/${encodeURIComponent(rid)}`}>
            فتح القائمة
          </Link>
        </div>
        <p className="text-sm text-white/60 mt-2">
          اجعل رمز QR يشير إلى:{' '}
          <code className="bg-white/10 px-2 py-1 rounded">/r/&lt;restaurantId&gt;</code>
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-2">لوحة الإدارة</h3>
          <p className="text-white/70 mb-4">إدارة المطعم والشعار والخلفية والمجموعات والأصناف</p>
          <button className="btn inline-block" onClick={() => handleGo('/admin')}>
            دخول لوحة الإدارة
          </button>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-2">محرر الأسعار</h3>
          <p className="text-white/70 mb-4">تعديل الأسعار فقط</p>
          <button className="btn inline-block" onClick={() => handleGo('/editor')}>
            اذهب للمحرر
          </button>
        </div>
      </section>
    </main>
  )
}
