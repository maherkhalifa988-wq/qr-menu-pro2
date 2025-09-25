'use client'
import { useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore'

type SeedCategory = {
  id?: string
  name?: string
  nameAr?: string
  nameEn?: string
  order?: number
  imageUrl?: string
  items?: string[] // الأصناف هنا مجرد أسماء نصية
}

type SeedRestaurant = {
  name?: string
  logoUrl?: string
  bgUrl?: string
  categories?: SeedCategory[]
}

export default function ImportFromJsonButton({ rid = 'al-nakheel' }: { rid?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  function openPicker() {
    inputRef.current?.click()
  }

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
          name: data.name ?? 'مطعم بدون اسم',
          logoUrl: data.logoUrl ?? '',
          bgUrl: data.bgUrl ?? '',
          updatedAt: Date.now(),
        },
        { merge: true }
      )

      // 2) تفريغ القديم
      const catsCol = collection(db, 'restaurants', rid, 'categories')
      const itemsCol = collection(db, 'restaurants', rid, 'items')
      const [oldCats, oldItems] = await Promise.all([
        getDocs(catsCol),
        getDocs(itemsCol),
      ])
      await Promise.all(oldItems.docs.map((d) => deleteDoc(d.ref)))
      await Promise.all(oldCats.docs.map((d) => deleteDoc(d.ref)))

      // 3) إضافة المجموعات والأصناف
      for (const c of data.categories ?? []) {
        // أنشئ المجموعة
        const catRef = await addDoc(catsCol, {
          name: c.name ?? c.nameAr ?? c.nameEn ?? '',
          nameAr: c.nameAr ?? '',
          nameEn: c.nameEn ?? '',
          order: c.order ?? 0,
          imageUrl: c.imageUrl ?? '',
          createdAt: Date.now(),
        })

        // أضف الأصناف التابعة لها
        for (const itemName of c.items ?? []) {
          await addDoc(itemsCol, {
            catId: catRef.id,
            name: itemName,
            nameAr: itemName,
            nameEn: itemName,
            price: 0,
            imageUrl: '',
            order: 0,
            createdAt: Date.now(),
          })
        }
      }

      alert('✅ تم استيراد القائمة بنجاح')
      e.target.value = ''
    } catch (err: any) {
      console.error(err)
      alert('❌ فشل الاستيراد: ' + (err?.message || 'خطأ غير معروف'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2">استيراد القائمة من JSON</h3>
      <p className="text-white/60 mb-3">
        اختر ملف JSON فيه اسم المطعم والمجموعات والأصناف. سيتم استبدال البيانات
        القديمة.
      </p>
      <div className="flex items-center gap-3">
        <button className="btn" onClick={openPicker} disabled={busy}>
          {busy ? 'جارٍ الاستيراد…' : 'رفع ملف JSON'}
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
