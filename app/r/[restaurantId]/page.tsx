'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

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
  catId: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
}

export default function RestaurantPublicPage() {
  const params = useParams() as { restaurantId?: string } |null
  const rid = params?.restaurantId??''

  const [cats, setCats] = useState<Cat[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  const labelCat = (c: Cat) =>
    (lang === 'ar' ? (c.nameAr || c.name) : (c.nameEn || c.name)) || 'بدون اسم'
  const labelItem = (i: Item) =>
    (lang === 'ar' ? (i.nameAr || i.name) : (i.nameEn || i.name)) || 'بدون اسم'

  useEffect(() => {
    async function load() {
      const qc = query(collection(db, 'restaurants', rid, 'categories'), orderBy('order', 'asc'))
      const qi = collection(db, 'restaurants', rid, 'items')
      const [cs, is] = await Promise.all([getDocs(qc), getDocs(qi)])
      setCats(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      setItems(is.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    }
    if (rid) { load() }
  }, [rid])

  const filtered = selectedCat ? items.filter(i => i.catId === selectedCat) : []

  return (
    <main className="container mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">القائمة</h1>
        <div className="flex gap-2">
          <button
            className={'btn-ghost ' + (lang === 'ar' ? 'ring-2 ring-white/30' : '')}
            onClick={() => setLang('ar')}
          >
            عربي
          </button>
          <button
            className={'btn-ghost ' + (lang === 'en' ? 'ring-2 ring-white/30' : '')}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </header>

      {!selectedCat && (
        <>
          <h2 className="font-bold mb-3">المجموعات</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cats.map(c => (
              <button
                key={c.id}
                className="card overflow-hidden text-left"
                onClick={() => setSelectedCat(c.id)}
                title="افتح المجموعة"
              >
                <div className="relative h-36 w-full bg-white/5">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40">لا توجد صورة</div>
                  )}
                </div>
                <div className="p-4 font-semibold">{labelCat(c)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedCat && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button className="btn-ghost" onClick={() => setSelectedCat(null)}>← رجوع للمجموعات</button>
            <div className="text-white/70">
              {labelCat(cats.find(c => c.id === selectedCat) || ({} as any))}
            </div>
          </div>

          <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(it => (
              <li key={it.id} className="card p-4">
                <div className="relative h-32 mb-3 bg-white/5 rounded">
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover rounded" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40">بدون صورة</div>
                  )}
                </div>
                <div className="font-semibold">{labelItem(it)}</div>
                <div className="text-white/60">{(it.price ?? 0).toString().padStart(3, '0')}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
