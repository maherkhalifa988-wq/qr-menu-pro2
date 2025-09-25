'use client'
import { useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc, setDoc, collection, addDoc, deleteDoc, getDocs, query, where
} from 'firebase/firestore'

type CatIn = {
  id?: string
  name?: string
  nameAr?: string
  nameEn?: string
  order?: number
  imageUrl?: string
  items?: Array<string | { name?: string; nameAr?: string; nameEn?: string; price?: number }>
}

type ItemIn = {
  id?: string
  // قد يأتي catId كـ ID أو كاسم المجموعة:
  catId?: string
  categoryName?: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
  order?: number
}

// يدعم شكلين:
// 1) { name, logoUrl, bgUrl, categories:[{ nameAr, items:[ "اسم" | {nameAr,price} ]}, ...] }
// 2) { name, logoUrl, bgUrl, categories:[{id?,nameAr,...}], items:[{catId(اسم أو ID), nameAr, price}, ...] }
type SeedRestaurant = {
  name?: string
  logoUrl?: string
  bgUrl?: string
  categories?: CatIn[]
  items?: ItemIn[]
}

function norm(s?: string) {
  return (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export default function ImportFromJsonButton({ rid = 'al-nakheel' }: { rid?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const openPicker = () => inputRef.current?.click()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text) as SeedRestaurant

      // 1) تحديث المستند الرئيسي
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
      await Promise.all(oldItems.docs.map(d => deleteDoc(d.ref)))
      await Promise.all(oldCats.docs.map(d => deleteDoc(d.ref)))

      // 3) إنشاء المجموعات الجديدة + خريطة ربط
      const createdById = new Map<string, string>()        // id القديم -> id الجديد
      const createdByName = new Map<string, string>()      // الاسم الموحّد -> id الجديد

      const categories: CatIn[] = data.categories || []

      for (const c of categories) {
        const name =
          c.name ?? c.nameAr ?? c.nameEn ?? ''
        const nameAr = c.nameAr ?? name
        const nameEn = c.nameEn ?? ''
        const ref = await addDoc(catsCol, {
          name, nameAr, nameEn,
          imageUrl: c.imageUrl ?? '',
          order: c.order ?? 0,
          createdAt: Date.now(),
        })
        if (c.id) createdById.set(c.id, ref.id)
        createdByName.set(norm(nameAr)  norm(name)  norm(nameEn), ref.id)

        // دعم صيغة: items مدمجة داخل المجموعة
        if (Array.isArray(c.items) && c.items.length) {
          for (const raw of c.items) {
            const obj = (typeof raw === 'string') ? { nameAr: raw } : raw
            await addDoc(itemsCol, {
              catId: ref.id,
              name: obj?.name ?? obj?.nameAr ?? obj?.nameEn ?? '',
              nameAr: obj?.nameAr ?? '',
              nameEn: obj?.nameEn ?? '',
              price: Number(obj?.price ?? 0),
              imageUrl: '',
              order: 0,
              createdAt: Date.now(),
            })
          }
        }
      }

      // 4) إن كان هناك مصفوفة عامة للأصناف، أضفها واربطها بالمجموعة الصحيحة
      if (Array.isArray(data.items) && data.items.length) {
        for (const it of data.items) {
          // حاول إيجاد catId الصحيح بهذا الترتيب:
          // - ID صريح تم إنشاؤه من خريطة createdById
          // - ID موجود مسبقًا في قاعدة البيانات (لو كان مرّ بنفس الاسم بالظبط)
          // - مطابقة الاسم (catId كاسم المجموعة، أو categoryName)
          let catIdNew = ''
// 4.1 via createdById
          if (it.catId && createdById.has(it.catId)) {
            catIdNew = createdById.get(it.catId) as string
          }

          // 4.2 via direct existing ID (نادرًا)
          if (!catIdNew && it.catId) {
            // نفحص هل يوجد مستند بهذه الهوية
            try {
              const qSnap = await getDocs(query(catsCol, where('name', '==', it.catId)))
              if (!qSnap.empty) catIdNew = it.catId
            } catch { /* ignore */ }
          }

          // 4.3 via name
          if (!catIdNew) {
            const candidate =
              it.categoryName  it.catId  ''
            const fromName = createdByName.get(norm(candidate))
            if (fromName) catIdNew = fromName
          }

          if (!catIdNew) {
            // لو فشل كل شيء، ضعه بلا مجموعة مؤقتًا
            console.warn('لم يتم العثور على مجموعة لهذا الصنف:', it.nameAr || it.name)
          }

          await addDoc(itemsCol, {
            catId: catIdNew || '',
            name: it.name ?? it.nameAr ?? it.nameEn ?? '',
            nameAr: it.nameAr ?? '',
            nameEn: it.nameEn ?? '',
            price: Number(it.price ?? 0),
            imageUrl: it.imageUrl ?? '',
            order: it.order ?? 0,
            createdAt: Date.now(),
          })
        }
      }

      alert('تم الاستيراد وربط الأصناف بالمجموعات ✅')
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
        يدعم ملفًا بسيطًا (مجموعات مع أصناف بداخلها) أو ملفًا متقدمًا (مجموعات + أصناف مستقلة). سيتم مسح القديم.
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
