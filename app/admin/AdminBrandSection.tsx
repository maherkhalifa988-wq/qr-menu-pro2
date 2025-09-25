'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { db, ensureSignedIn } from '@/lib/firebase'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, addDoc, deleteDoc, writeBatch
} from 'firebase/firestore'

// رفع الصور عبر مسار السيرفر /api/upload
async function uploadViaApiRoute(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)

  const res  = await fetch('/api/upload', { method: 'POST', body: fd })
  const text = await res.text()

  let data: any = null
  try { data = JSON.parse(text) } catch {}

  if (!res.ok) throw new Error(data?.error||text||'HTTP ${res.status}')
  const url = data?.url as string | undefined
  if (!url) throw new Error('Upload OK but no url in response')
  return url
}

type Props = { rid: string }

/** شكل JSON المتوقع تقريبًا:
{
  "name": "Al-Nakheel",
  "categories": [
    {
      "nameAr": "مشروبات",
      "nameEn": "Drinks",
      "order": 1,
      "items": [
        { "nameAr":"شاي", "nameEn":"Tea", "price":5, "imageUrl": "" }
      ]
    }
  ]
}
*/
export default function AdminBrandSection({ rid }: Props) {
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)
  const [savingBg, setSavingBg] = useState(false)
  const [importingJSON, setImportingJSON] = useState(false)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [bgUrl, setBgUrl] = useState<string>('')

  // تحميل بيانات المطعم
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await ensureSignedIn()
        const ref = doc(db, 'restaurants', rid)
        const snap = await getDoc(ref)
        if (!mounted) return

        if (snap.exists()) {
          const data = snap.data() as any
          setName(data.name ?? '')
          setLogoUrl(data.logoUrl ?? '')
          setBgUrl(data.bgUrl ?? '')
        } else {
          await setDoc(
            ref,
            { name: '', logoUrl: '', bgUrl: '', updatedAt: Date.now() },
            { merge: true }
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [rid])

  // حفظ الاسم
  async function saveName() {
    setSavingName(true)
    try {
      await updateDoc(doc(db, 'restaurants', rid), { name, updatedAt: Date.now() })
      alert('✅ تم حفظ الاسم')
    } finally {
      setSavingName(false)
    }
  }

  // رفع الشعار
  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setSavingLogo(true)
    try {
      const url = await uploadViaApiRoute(f)
      setLogoUrl(url)
      await updateDoc(doc(db, 'restaurants', rid), { logoUrl: url, updatedAt: Date.now() })
      alert('✅ تم رفع الشعار وحفظه')
    } catch (err: any) {
      console.error(err)
      alert(`❌ مشكلة: ${err?.message ?? err}`)
    } finally {
      setSavingLogo(false)
      e.target.value = ''
    }
  }

  // رفع الخلفية
  async function onUploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setSavingBg(true)
    try {
      const url = await uploadViaApiRoute(f)
      setBgUrl(url)
      await updateDoc(doc(db, 'restaurants', rid), { bgUrl: url, updatedAt: Date.now() })
      alert('✅ تم رفع الخلفية وحفظها')
    } catch (err: any) {
      console.error(err)
      alert(`❌ مشكلة: ${err?.message ?? err}`)
    } finally {
      setSavingBg(false)
      e.target.value = ''
    }
  }

  // استيراد ملف JSON واستبدال البيانات
// async function onImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
//   const file = e.target.files?.[0]
//   if (!file) return
//   setImportingJSON(true)

//   try {
//     const text = await file.text()
//     const parsed = JSON.parse(text) as {
//       name?: string
//       categories?: Array<{
//         name?: string
//         nameAr?: string
//         nameEn?: string
//         order?: number
//         imageUrl?: string
//         items?: Array<{
//           name?: string
//           nameAr?: string
//           nameEn?: string
//           price?: number
//           imageUrl?: string
//           order?: number
//         }>
//       }>
//     }

//     // تحقق سريع
//     const incomingName = parsed?.name ?? ''
//     const categories   = Array.isArray(parsed?.categories) ? parsed.categories : []

//     // 1) حدّث اسم المطعم لو موجود
//     if (incomingName) {
//       await updateDoc(doc(db, 'restaurants', rid), {
//         name: incomingName,
//         updatedAt: Date.now(),
//       })
//       setName(incomingName)
//     }

//     // 2) احذف المجموعات القديمة + عناصرها + العناصر الجذرية
//     const catsCol  = collection(db, 'restaurants', rid, 'categories')
//     const rootItemsCol = collection(db, 'restaurants', rid, 'items')

//     // احذف العناصر الجذرية
//     {
//       const rootSnap = await getDocs(rootItemsCol)
//       const batch = writeBatch(db)
//       rootSnap.forEach(d => batch.delete(d.ref))
//       await batch.commit()
//     }
//     // احذف المجموعات وعناصرها
//     {
//       const snap = await getDocs(catsCol)
//       const batch = writeBatch(db)
//       for (const c of snap.docs) {
//         const itemsCol = collection(db, 'restaurants', rid, 'categories', c.id, 'items')
//         const itemsSnap = await getDocs(itemsCol)
//         itemsSnap.forEach((it) => batch.delete(it.ref))
//         batch.delete(c.ref)
//       }
//       await batch.commit()
//     }

//     // 3) أضف الجديد
//     for (const cat of categories) {
//       const catRef = await addDoc(catsCol, {
//         name: (cat?.nameAr||cat?.nameEn||cat?.name || ''),
//         nameAr: cat?.nameAr || '',
//         nameEn: cat?.nameEn || '',
//         order: typeof cat?.order === 'number' ? cat.order : 0,
//         imageUrl: cat?.imageUrl || '',
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       })

//       const items = Array.isArray(cat?.items) ? cat.items : []
//       for (const item of items) {
//         const payload = {
//           name: (item?.nameAr||item?.nameEn||item?.name || ''),
//           nameAr: item?.nameAr || '',
//           nameEn: item?.nameEn || '',
//           price: typeof item?.price === 'number' ? item.price : 0,
//           imageUrl: item?.imageUrl || '',
//           order: typeof item?.order === 'number' ? item.order : 0,
//           createdAt: Date.now(),
//           updatedAt: Date.now(),
//         }

//         // أ) أضف في subcollection تحت المجموعة (لوحة الإدارة تعتمد عليه)
//         await addDoc(collection(db, 'restaurants', rid, 'categories', catRef.id, 'items'), payload)

//         // ب) أضف أيضًا نسخة في الجذر مع catId (واجهة الزبون تقرأ من هنا)
//         await addDoc(rootItemsCol, { ...payload, catId: catRef.id })
//       }
//     }

//     alert('✅ تم استيراد ملف JSON واستبدال البيانات بنجاح')
//   } catch (err: any) {
//     console.error(err)
//     alert(`❌ فشل استيراد JSON: ${err?.message ?? err}`)
//   } finally {
//     setImportingJSON(false)
//     e.target.value = ''
//   }
// }
  if (loading) {
    return (
      <section className="card p-5 my-6">
        <div className="text-white/70">...جارِ تحميل بيانات المطعم</div>
      </section>
    )
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
          {logoUrl ? (
            <div className="mt-3">
              <Image
                src={logoUrl}
                alt="Logo"
                width={160}
                height={160}
                className="rounded-xl border border-white/10"
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
          {bgUrl ? (
            <div className="mt-3">
              <Image
                src={bgUrl}
                alt="Background"
                width={500}
                height={280}
                className="rounded-xl border border-white/10 object-cover"
              />
            </div>
          ) : (
            <p className="text-white/50 text-sm mt-2">لا توجد خلفية بعد</p>
          )}
        </div>
      </div>

      {/* استيراد JSON */}
      <div className="mt-8">
        <label className="label">استيراد القائمة من JSON</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="application/json" onChange={onImportJSON} disabled={importingJSON} />
          {importingJSON && <span className="text-white/70 text-sm">...جارٍ الاستيراد</span>}
        </div>
        <p className="text-white/40 text-xs mt-2">
          سيؤدي الاستيراد إلى استبدال المجموعات والأصناف الحالية بالكامل.
        </p>
      </div>
    </section>
  )
}
