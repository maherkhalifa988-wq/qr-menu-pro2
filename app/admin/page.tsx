// app/admin/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminBrandSection from './AdminBrandSection'
import ImportFromJsonButton from './ImportFromJsonButton'
import uploadImage from '@/lib/uploadImage'

const RID = 'al-nakheel'

type Cat = {
  id: string
  name?: string
  nameAr?: string
  nameEn?: string
  imageUrl?: string
  order?: number
}
type Item = {
  id: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
  order?: number
}

export default function AdminPage() {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [bgUrl, setBgUrl] = useState<string | undefined>()

  const [loadingCats, setLoadingCats] = useState(true)
  const [cats, setCats] = useState<Cat[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  const [loadingItems, setLoadingItems] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)

  // تحميل المجموعات
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoadingCats(true)
        const qc = query(
          collection(db, 'restaurants', RID, 'categories'),
          orderBy('order', 'asc')
        )
        const snap = await getDocs(qc)
        if (!alive) return
        setCats(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        if (alive) setLoadingCats(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // أصناف المجموعة المختارة
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!selectedCat) { setItems([]); return }
      setLoadingItems(true)
      try {
        const col = collection(db, 'restaurants', RID, 'categories', selectedCat, 'items')
        const snap = await getDocs(col)
        if (!alive) return
        setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        if (alive) setLoadingItems(false)
      }
    })()
    return () => { alive = false }
  }, [selectedCat])

  const currentCat = useMemo(
    () => cats.find(c => c.id === selectedCat) || null,
    [cats, selectedCat]
  )

  async function saveCat(c: Cat) {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'restaurants', RID, 'categories', c.id), {
        name: c.name ?? c.nameAr ?? c.nameEn ?? '',
        nameAr: c.nameAr ?? '',
        nameEn: c.nameEn ?? '',
        imageUrl: c.imageUrl ?? '',
        order: typeof c.order === 'number' ? c.order : 0,
      })
      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, ...c } : x)))
      alert('تم حفظ بيانات المجموعة')
    } catch (e: any) {
      console.error(e); alert('فشل حفظ المجموعة: ' + (e?.message || ''))
    } finally { setSaving(false) }
  }

  async function deleteCat(catId: string) {
    if (!confirm('سيتم حذف المجموعة وجميع أصنافها. هل أنت متأكد؟')) return
    setSaving(true)
    try {
      const itemsCol = collection(db, 'restaurants', RID, 'categories', catId, 'items')
      const itemsSnap = await getDocs(itemsCol)
      const batch = writeBatch(db)
      itemsSnap.forEach(d => batch.delete(d.ref))
      batch.delete(doc(db, 'restaurants', RID, 'categories', catId))
      await batch.commit()
      setCats(prev => prev.filter(c => c.id !== catId))
      if (selectedCat === catId) { setSelectedCat(null); setItems([]) }
      alert('تم الحذف')
    } catch (e: any) {
      console.error(e); alert('فشل الحذف: ' + (e?.message || ''))
    } finally { setSaving(false) }
  }

  async function saveItemPrice(itemId: string, newPrice: number) {
    if (!selectedCat) return
    setSaving(true)
    try {
      await updateDoc(
        doc(db, 'restaurants', RID, 'categories', selectedCat, 'items', itemId),
        { price: Number(newPrice || 0) }
      )
      setItems(prev => prev.map(it => (it.id === itemId ? { ...it, price: newPrice } : it)))
    } catch (e: any) {
      console.error(e); alert('فشل حفظ السعر: ' + (e?.message || ''))
    } finally { setSaving(false) }
  }

  // رفع صورة للمجموعة
  async function handleUploadCatImage(file: File, catId: string) {
    try {
      const url = await uploadImage(file, 'categories')
      setCats(prev => prev.map(c => (c.id === catId ? { ...c, imageUrl: url } : c)))
    } catch (e: any) {
      alert('فشل رفع الصورة: ' + (e?.message || e))
    }
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة الإدارة</h1>

      {/* 1) الهوية */}
      <AdminBrandSection
        rid={RID}
        name={name}
        setName={setName}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        bgUrl={bgUrl}
        setBgUrl={setBgUrl}
      />

      {/* 2) استيراد JSON */}
      <section className="my-6">
        <ImportFromJsonButton rid={RID} />
      </section>

      {/* 3) إدارة المجموعات */}
      <section className="card p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">إدارة المجموعات</h2>
          {loadingCats && <span className="text-white/60 text-sm">...جارٍ التحميل</span>}
        </div>

        {cats.length === 0 && !loadingCats ? (
          <p className="text-white/60">لا توجد مجموعات بعد.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {cats.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <b>#{c.order ?? 0}</b>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => setSelectedCat(c.id)}>
                      أصناف المجموعة
                    </button>
                    <button
                      className="btn-ghost text-red-300"
                      onClick={() => deleteCat(c.id)}
                      disabled={saving}
                      title="حذف المجموعة مع كافة الأصناف"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <label className="text-sm">الاسم (عربي)</label>
                  <input
                    className="input"
                    value={c.nameAr ?? ''}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, nameAr: e.target.value } : x)))
                    }
                  />
                  <label className="text-sm">Name (English)</label>
                  <input
                    className="input"
                    value={c.nameEn ?? ''}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, nameEn: e.target.value } : x)))
                    }
                  />

                  {/* زر رفع صورة */}
                  <label className="text-sm">صورة المجموعة</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadCatImage(f, c.id)
                      }}
                    />
                    {c.imageUrl && (
                      <Image
                        src={c.imageUrl}
                        alt="صورة المجموعة"
                        width={80}
                        height={60}
                        className="rounded border border-white/10 object-cover"
                      />
                    )}
                  </div>

                  <label className="text-sm">الترتيب</label>
                  <input
                    type="number"
                    className="input"
                    value={c.order ?? 0}
                    onChange={(e) =>
                      setCats(prev => prev.map(x => (x.id === c.id ? { ...x, order: Number(e.target.value || 0) } : x)))
                    }
                  />
                </div>

                <div className="mt-3">
                  <button
                    className="btn"
                    onClick={() => saveCat(c)}
                    disabled={saving}
                  >
                    حفظ المجموعة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4) محرر أسعار الأصناف */}
      <section className="card p-5 my-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">تعديل أسعار الأصناف</h2>
          <select
            className="input"
            value={selectedCat ?? ''}
            onChange={(e) => setSelectedCat(e.target.value || null)}
          >
            <option value="">— اختر مجموعة —</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.nameAr || c.name || c.nameEn || c.id}</option>
            ))}
          </select>
        </div>

        {!selectedCat ? (
          <p className="text-white/60">اختر مجموعة لعرض أصنافها.</p>
        ) : loadingItems ? (
          <p className="text-white/60">...جارٍ تحميل الأصناف</p>
        ) : items.length === 0 ? (
          <p className="text-white/60">لا توجد أصناف داخل هذه المجموعة.</p>
        ) : (
          <table className="w-full border border-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="p-2 text-right">الاسم (عربي)</th>
                <th className="p-2 text-right">Name (English)</th>
                <th className="p-2 text-right">السعر</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t border-white/10">
                  <td className="p-2">{it.nameAr || it.name || '-'}</td>
                  <td className="p-2">{it.nameEn || '-'}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="input w-32"
                      defaultValue={typeof it.price === 'number' ? it.price : 0}
                      onBlur={(e) => saveItemPrice(it.id, Number(e.target.value || 0))}
                    />
                  </td>
                  <td className="p-2 text-white/50 text-xs">يحفظ عند الخروج من الحقل</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
