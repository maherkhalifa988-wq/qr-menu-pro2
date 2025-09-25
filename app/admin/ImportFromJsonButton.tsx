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
  items?: Array<string | {
    name?: string
    nameAr?: string
    nameEn?: string
    price?: number
    imageUrl?: string
    order?: number
  }>
}

type SeedItem = {
  id?: string
  catId: string            // قد يكون ID قديم أو اسم مجموعة
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

function norm(s?: string) {
  return (s || '').trim()
}

export default function ImportFromJsonButton({ rid = 'al-nakheel' }: { rid?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  function openPicker() { inputRef.current?.click() }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as SeedRestaurant

      // 1) حدّث مستند المطعم
      await setDoc(
        doc(db, 'restaurants', rid),
        {
          name: data.name ?? 'مطعم النخيل',
          logoUrl: data.logoUrl ?? '',
          bgUrl: data.bgUrl ?? '',
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      // 2) افرغ القديم (flat structure التي تستخدمها صفحة الزبون)
      const catsCol  = collection(db, 'restaurants', rid, 'categories')
      const itemsCol = collection(db, 'restaurants', rid, 'items')

      const [oldCatsSnap, oldItemsSnap] = await Promise.all([
        getDocs(catsCol),
        getDocs(itemsCol),
      ])
      await Promise.all(oldItemsSnap.docs.map(d => deleteDoc(d.ref)))
      await Promise.all(oldCatsSnap.docs.map(d => deleteDoc(d.ref)))

      // 3) أنشئ المجموعات واحفظ خريطة
      const createdById   = new Map<string, string>()
      const createdByName = new Map<string, string>() // مفتاحها اسم موحّد

      const categories = Array.isArray(data.categories) ? data.categories : []

      for (const c of categories) {
        const nameAr = c.nameAr ?? ''
        const nameEn = c.nameEn ?? ''
        const name   = c.name ?? (nameAr || nameEn)

        const ref = await addDoc(catsCol, {
          name,
          nameAr,
          nameEn,
          imageUrl: c.imageUrl ?? '',
          order: typeof c.order === 'number' ? c.order : 0,
          createdAt: Date.now(),
        })

        // اربط الـ id القديم بالـ id الجديد
        if (c.id) createdById.set(c.id, ref.id)
        // اربط الاسم الموحّد بالـ id الجديد (كما لو أن catId في الأصناف قد يأتي كاسم)
        createdByName.set(norm(nameAr)||norm(name)||norm(nameEn), ref.id)

        // دعم items داخل المجموعة نفسها (سلاسل أو كائنات)
        const embedded = Array.isArray(c.items) ? c.items : []
        for (const it of embedded) {
          if (typeof it === 'string') {
            await addDoc(itemsCol, {
              catId: ref.id,
              name: it,
              nameAr: it,
              nameEn: '',
              price: 0,
              imageUrl: '',
              order: 0,
              createdAt: Date.now(),
            })
          } else {
            await addDoc(itemsCol, {
              catId: ref.id,
              name: it.name ?? it.nameAr ?? it.nameEn ?? '',
              nameAr: it.nameAr ?? '',
              nameEn: it.nameEn ?? '',
              price: Number(it.price ?? 0),
              imageUrl: it.imageUrl ?? '',
              order: typeof it.order === 'number' ? it.order : 0,
              createdAt: Date.now(),
            })
          }
        }
      }
      // 4) أضف الأصناف المرسلة بشكل منفصل في data.items (لو موجودة)
      const extraItems = Array.isArray(data.items) ? data.items : []
      for (const it of extraItems) {
        const candidate = it.catId ?? ''            // قد يكون id قديم أو اسم
        const byId   = createdById.get(candidate)
        const byName = createdByName.get(norm(candidate))
        const catId  = byId  byName  candidate  // آخر حل: اتركه كما هو لو هو ID صحيح

        await addDoc(itemsCol, {
          catId,
          name: it.name ?? it.nameAr ?? it.nameEn ?? '',
          nameAr: it.nameAr ?? '',
          nameEn: it.nameEn ?? '',
          price: Number(it.price ?? 0),
          imageUrl: it.imageUrl ?? '',
          order: typeof it.order === 'number' ? it.order : 0,
          createdAt: Date.now(),
        })
      }

      alert('✅ تم استيراد القائمة وربط الأصناف بالمجموعات بنجاح')
      e.target.value = ''
    } catch (err: any) {
      console.error(err)
      alert('❌ فشل الاستيراد: ' + (err?.message || ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2">استيراد القائمة من JSON</h3>
      <p className="text-white/60 mb-3">
        ارفع ملف JSON (فيه name/logoUrl/bgUrl و categories (مع items اختياريًا) و items (اختياريًا)). سيتم استبدال البيانات القديمة.
      </p>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={openPicker} disabled={busy}>
          {busy ? 'جارِ الاستيراد…' : 'رفع ملف JSON'}
        </button>
        <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} hidden />
      </div>
    </div>
  )
}
