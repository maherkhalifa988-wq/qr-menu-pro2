'use client'
import { useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc, setDoc, collection, addDoc, deleteDoc, getDocs,
} from 'firebase/firestore'

type SeedCategory = {
  id?: string
  name?: string
  nameAr?: string
  nameEn?: string
  order?: number
  imageUrl?: string
  // دعم items داخل المجموعة (اختياري)
  items?: Array<string | { name?: string; nameAr?: string; nameEn?: string; price?: number; imageUrl?: string; order?: number }>
}

type SeedItem = {
  id?: string
  catId: string // يمكن أن تكون ID قديمة أو اسم مجموعة
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
  order?: number
}

type SeedRestaurant = {
  name?: string
  logoUrl?: string
  bgUrl?: string
  categories?: SeedCategory[]
  items?: SeedItem[]
}

export default function ImportFromJsonButton({ rid = 'al-nakheel' }: { rid?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const openPicker = () => inputRef.current?.click()

  // دالة تطبيع نص للاسم (تسهيل المطابقة بالاسم)
  const norm = (s?: string) => (s ?? '').trim().replace(/\s+/g, '').toLowerCase()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as SeedRestaurant

      // 1) تحديث مستند المطعم
      await setDoc(
        doc(db, 'restaurants', rid),
        {
          name: data.name ?? 'مطعم',
          logoUrl: data.logoUrl ?? '',
          bgUrl: data.bgUrl ?? '',
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      // 2) تفريغ القديم
      const catsCol = collection(db, 'restaurants', rid, 'categories')
      const itemsCol = collection(db, 'restaurants', rid, 'items')
      const [oldCats, oldItems] = await Promise.all([getDocs(catsCol), getDocs(itemsCol)])
      await Promise.all(oldItems.docs.map((d) => deleteDoc(d.ref)))
      await Promise.all(oldCats.docs.map((d) => deleteDoc(d.ref)))

      // 3) إضافة المجموعات وبناء خرائط المطابقة
      const createdById = new Map<string, string>()     // تخزن ID قديم -> ID جديد
      const createdByName = new Map<string, string>()   // تخزن الاسم المطبع -> ID جديد

      for (const c of data.categories ?? []) {
        const nameAr = c.nameAr ?? ''
        const nameEn = c.nameEn ?? ''
        const name = c.name ?? nameAr || nameEn

        const ref = await addDoc(catsCol, {
          name,
          nameAr,
          nameEn,
          order: c.order ?? 0,
          imageUrl: c.imageUrl ?? '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        if (c.id) createdById.set(c.id, ref.id)

        // ⚠️ هنا كان الخطأ: يجب استخدام || بين الاستدعاءات
        const key = norm(nameAr)||norm(name)||norm(nameEn)
        if (key) createdByName.set(key, ref.id)

        // دعم وجود items داخل نفس المجموعة
        if (Array.isArray(c.items) && c.items.length) {
          for (const raw of c.items) {
            const o =
              typeof raw === 'string'
                ? { nameAr: raw as string }
                : (raw as any)

            await addDoc(itemsCol, {
              catId: ref.id,
              name: o.name ?? o.nameAr ?? o.nameEn ?? '',
              nameAr: o.nameAr ?? '',
              nameEn: o.nameEn ?? '',
              price: Number(o.price ?? 0),
              imageUrl: o.imageUrl ?? '',
              order: Number(o.order ?? 0),
              createdAt: Date.now(),
            })
          }
        }
      }

      // 4) إضافة الأصناف من الجذر (إن وُجدت)
      for (const it of data.items ?? []) {
        // catId قد تكون:
        // - ID قديم مذكور في JSON
        // - اسم مجموعة (عربي/إنجليزي) سنطابقه بعد التطبيع
        const candidate = it.catId ?? ''
        const byId = createdById.get(candidate)
        const byName = createdByName.get(norm(candidate))
        const catId = byId  byName  candidate // آخر محاولة: كما هي (لو كانت ID جديد بالفعل)
        await addDoc(itemsCol, {
          catId,
          name: it.name ?? it.nameAr ?? it.nameEn ?? '',
          nameAr: it.nameAr ?? '',
          nameEn: it.nameEn ?? '',
          price: Number(it.price ?? 0),
          imageUrl: it.imageUrl ?? '',
          order: Number(it.order ?? 0),
          createdAt: Date.now(),
        })
      }

      alert('تم استيراد القائمة بنجاح ✅')
      e.target.value = ''
    } catch (err: any) {
      console.error(err)
      alert('فشل الاستيراد: ' + (err?.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2">استيراد القائمة من JSON</h3>
      <p className="text-white/60 mb-3">
        اختر ملف JSON فيه اسم المطعم والمجموعات والأصناف (يمكن وضع الأصناف داخل كل مجموعة أو في الجذر).
        سيتم استبدال البيانات الحالية.
      </p>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'جارِ الاستيراد…' : 'رفع ملف JSON'}
        </button>
        <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} hidden />
      </div>
    </div>
  )
}
