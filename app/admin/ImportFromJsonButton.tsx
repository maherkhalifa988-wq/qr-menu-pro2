'use client'
import { useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc, setDoc,
  collection, addDoc, deleteDoc, getDocs
} from 'firebase/firestore'

type JsonCategoryItem =
  | string
  | {
      name?: string
      nameAr?: string
      nameEn?: string
      price?: number
      imageUrl?: string
      order?: number
    }

type JsonCategory = {
  id?: string
  name?: string
  nameAr?: string
  nameEn?: string
  order?: number
  imageUrl?: string
  items?: JsonCategoryItem[]
}

type SeedJson = {
  restaurantId?: string
  restaurantName?: string
  name?: string
  logoUrl?: string
  bgUrl?: string
  defaultPrice?: number
  categories?: JsonCategory[]
}

export default function ImportFromJsonButton({ rid = 'al-nakheel' }: { rid?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  function openPicker() {
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    // داخل handleFile
const [oldCats, oldItems] = await Promise.all([getDocs(catsCol), getDocs(itemsCol)])
await Promise.all(oldItems.docs.map(d => deleteDoc(d.ref)))
await Promise.all(oldCats.docs.map(d => deleteDoc(d.ref)))
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      // 0) اقرأ JSON
      const text = await file.text()
      const data = JSON.parse(text) as SeedJson

      // 1) حدّث مستند المطعم
      await setDoc(
        doc(db, 'restaurants', rid),
        {
          name: data.restaurantName ?? data.name ?? 'مطعم',
          logoUrl: data.logoUrl ?? '',
          bgUrl: data.bgUrl ?? '',
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      // 2) نظّف القديم (مجموعات + أصناف)
      const catsCol = collection(db, 'restaurants', rid, 'categories')
      const itemsCol = collection(db, 'restaurants', rid, 'items')
      const [oldCats, oldItems] = await Promise.all([getDocs(catsCol), getDocs(itemsCol)])

      await Promise.all(oldItems.docs.map((d) => deleteDoc(d.ref)))
      await Promise.all(oldCats.docs.map((d) => deleteDoc(d.ref)))

      // 3) أضف المجموعات وأحفظ map من id القديم إلى الجديد
      const createdCats = new Map<string, string>()
      const defaultPrice = Number(data.defaultPrice ?? 0)

      for (const c of data.categories ?? []) {
        const catRef = await addDoc(catsCol, {
          name: c.name ?? c.nameAr ?? c.nameEn ?? '',
          nameAr: c.nameAr ?? '',
          nameEn: c.nameEn ?? '',
          order: typeof c.order === 'number' ? c.order : 0,
          imageUrl: c.imageUrl ?? '',
          createdAt: Date.now(),
        })
        if (c.id) createdCats.set(c.id, catRef.id)

        // 4) أضف الأصناف التابعة لهذه المجموعة (إن وجدت)
        const items = Array.isArray(c.items) ? c.items : []
        for (const it of items) {
          // العنصر قد يكون string أو object
          const asObj =
            typeof it === 'string'
              ? { name: it, nameAr: it }
              : (it as NonNullable<JsonCategory['items']>[number])

          const name =
            (asObj as any).name ??
            (asObj as any).nameAr ??
            (asObj as any).nameEn ??
            ''

          const price =
            typeof (asObj as any).price === 'number'
              ? (asObj as any).price
              : defaultPrice

          const imageUrl =
            typeof (asObj as any).imageUrl === 'string'
              ? (asObj as any).imageUrl
              : ''

          const orderVal =
            typeof (asObj as any).order === 'number'
              ? (asObj as any).order
              : 0

          await addDoc(itemsCol, {
            catId: catRef.id,
            name,
            nameAr: (asObj as any).nameAr ?? name,
            nameEn: (asObj as any).nameEn ?? '',
            price,
            imageUrl,
            order: orderVal,
            createdAt: Date.now(),
          })
        }
      }

      alert('تم استيراد القائمة بنجاح ✅')
      e.target.value = ''
    } catch (err: any) {
      console.error('IMPORT_JSON_ERROR', err)
      alert('فشل الاستيراد: ' + (err?.message || ''))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2">استيراد القائمة من JSON</h3>
      <p className="text-white/60 mb-3">
        اختر ملف JSON فيه اسم المطعم والمجموعات والأصناف (الأصناف داخل كل مجموعة). سيتم استبدال البيانات القديمة.
      </p>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={openPicker} disabled={busy}>
          {busy ? 'جارِ الاستيراد…' : 'رفع ملف JSON'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={handleFile}
          hidden
        />
      </div>
    </div>
  )
}
