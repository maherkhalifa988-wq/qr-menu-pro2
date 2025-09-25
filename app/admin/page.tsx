// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// مكوّنات الإدارة
import AdminBrandSection from './AdminBrandSection'
import ImportFromJsonButton from './ImportFromJsonButton'

const RID = 'al-nakheel' // عدّلها إن لزم

export default function AdminPage() {
  // حالات قسم الهوية لتمريرها إلى AdminBrandSection
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [bgUrl, setBgUrl] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  // تحميل القيم الحالية من Firestore عند فتح صفحة الأدمن
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'restaurants', RID))
        if (!alive) return
        if (snap.exists()) {
          const r = snap.data() as any
          setName(r?.name ?? '')
          setLogoUrl(r?.logoUrl)
          setBgUrl(r?.bgUrl)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>

      {/* الهوية (اسم/شعار/خلفية) */}
      <AdminBrandSection
        rid={RID}
        name={name}
        setName={setName}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        bgUrl={bgUrl}
        setBgUrl={setBgUrl}
      />

      {/* استيراد JSON للمجموعات والأصناف */}
      <section className="my-6">
        <ImportFromJsonButton rid={RID} />
      </section>

      {/* placeholder بسيط كي تتأكد أن الصفحة تعمل – احذفه لاحقًا */}
      {!loading && (
        <section className="card p-5">
          <p className="text-white/70">
            إن لم يظهر زر الاستيراد أعلاه فتأكد أن الملف:
            <code className="bg-white/10 px-2 py-1 mx-2 rounded">app/admin/ImportFromJsonButton.tsx</code>
            موجود ومصدّره هو <b>default</b>.
          </p>
        </section>
      )}
    </main>
  )
}
