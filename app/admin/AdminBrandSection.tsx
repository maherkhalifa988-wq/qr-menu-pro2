'use client'

import { useState } from 'react'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

const isValidUrl = (u?: string) =>
  typeof u === 'string' && /^https?:\/\//i.test(u.trim())

export default function AdminBrandSection({
  rid,
  name,
  setName,
  logoUrl,
  setLogoUrl,
  bgUrl,
  setBgUrl,
}: {
  rid: string
  name: string
  setName: (v: string) => void
  logoUrl?: string
  setLogoUrl: (v: string) => void
  bgUrl?: string
  setBgUrl: (v: string) => void
}) {
  const [savingName, setSavingName] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)
  const [savingBg, setSavingBg] = useState(false)

  async function saveName() {
    setSavingName(true)
    try {
      await updateDoc(doc(db, 'restaurants', rid), {
        name,
        updatedAt: Date.now(),
      })
      alert('✅ تم حفظ الاسم')
    } catch (err: any) {
      console.error(err)
      alert('❌ فشل الحفظ: ' + (err.message || 'خطأ غير معروف'))
    } finally {
      setSavingName(false)
    }
  }

  // رفع الشعار
  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSavingLogo(true)
    try {
      const url = URL.createObjectURL(file) // هنا مؤقتاً، غيّره لرفع Cloudinary عندك
      await updateDoc(doc(db, 'restaurants', rid), {
        logoUrl: url,
        updatedAt: Date.now(),
      })
      setLogoUrl(url)
    } finally {
      setSavingLogo(false)
    }
  }

  // رفع الخلفية
  async function onUploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSavingBg(true)
    try {
      const url = URL.createObjectURL(file) // هنا مؤقتاً، غيّره لرفع Cloudinary عندك
      await updateDoc(doc(db, 'restaurants', rid), {
        bgUrl: url,
        updatedAt: Date.now(),
      })
      setBgUrl(url)
    } finally {
      setSavingBg(false)
    }
  }

  return (
    <section className="card p-5 my-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">الهوية (الشعار/الخلفية/الاسم)</h2>
      </div>

      {/* اسم المطعم */}
      <div className="mb-6">
        <label className="label">اسم المطعم</label>
        <div className="flex gap-2 max-w-xl">
          <input
            className="input flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اكتب اسم المطعم"
          />
          <button className="btn" onClick={saveName} disabled={savingName}>
            {savingName ? 'جارٍ الحفظ…' : 'حفظ الاسم'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* الشعار */}
        <div>
          <label className="label">الشعار</label>
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={onUploadLogo} disabled={savingLogo} />
            {savingLogo && <span className="text-white/70 text-sm">...جارٍ الرفع</span>}
          </div>
          {isValidUrl(logoUrl) ? (
            <div className="mt-3">
              <Image
                src={logoUrl!}
                alt="Logo"
                width={160}
                height={160}
                className="rounded-xl border border-white/10 object-cover"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-white/50 text-sm mt-2">لا يوجد شعار بعد</p>
          )}
        </div>

        {/* الخلفية */}
        <div>
          <label className="label">الخلفية</label>
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={onUploadBg} disabled={savingBg} />
            {savingBg && <span className="text-white/70 text-sm">...جارٍ الرفع</span>}
            </div>
          {isValidUrl(bgUrl) ? (
            <div className="mt-3">
              <Image
                src={bgUrl!}
                alt="Background"
                width={500}
                height={280}
                className="rounded-xl border border-white/10 object-cover"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-white/50 text-sm mt-2">لا توجد خلفية بعد</p>
          )}
        </div>
      </div>
    </section>
  )
}
