'use client'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminBrandSection from './AdminBrandSection'

const RID = 'al-nakheel'

export default function AdminPage() {
  // الحالات المطلوبة لتمريرها لـ AdminBrandSection
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [bgUrl, setBgUrl] = useState<string | undefined>()

  // (اختياري) تحميل القيم الحالية من Firestore عند فتح صفحة الأدمن
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'restaurants', RID))
      if (snap.exists()) {
        const r = snap.data() as any
        setName(r?.name ?? '')
        setLogoUrl(r?.logoUrl)
        setBgUrl(r?.bgUrl)
      }
    })()
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

      {/* ... باقي أقسام الإدارة ... */}
    </main>
  )
}
