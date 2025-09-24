'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'

type Cat = {
  id: string
  name?: string
  nameAr?: string
  nameEn?: string
  order?: number
}
type Item = {
  id: string
  catId: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
}

export default function RestaurantPublicPage() {
  const params = useParams() as { restaurantId?: string } | null
  const rid = params?.restaurantId ?? ''

  const [cats, setCats] = useState<Cat[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [bgUrl, setBgUrl] = useState<string>('')

  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  const labelCat = (c: Cat) =>
    (lang === 'ar' ? (c.nameAr||c.name) : (c.nameEn||c.name)) || 'بدون اسم'
  const labelItem = (i: Item) =>
    (lang === 'ar' ? (i.nameAr||i.name) : (i.nameEn||i.name)) || 'بدون اسم'

  useEffect(() => {
    async function load() {
      if (!rid) return
      // تحميل بيانات المطعم (الشعار + الخلفية)
      const ref = doc(db, 'restaurants', rid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = snap.data() as any
        setBgUrl(data.bgUrl ?? '')
      }

      // تحميل المجموعات
      const qc = query(collection(db, 'restaurants', rid, 'categories'), orderBy('order', 'asc'))
      const qi = collection(db, 'restaurants', rid, 'items')
      const [cs, is] = await Promise.all([getDocs(qc), getDocs(qi)])
      setCats(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      setItems(is.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    }
    load()
  }, [rid])

  return (
    <main
      className="min-h-screen p-6 text-white"
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl}) `: undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <header className="flex items-center justify-between mb-6 bg-black/50 p-3 rounded">
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

      {cats.map(cat => (
        <section key={cat.id} className="mb-8 bg-black/40 p-4 rounded">
          <h2 className="font-bold text-xl mb-3">{labelCat(cat)}</h2>
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.filter(i => i.catId === cat.id).map(it => (
              <li key={it.id} className="card p-4 bg-black/50">
                {/* حذف صورة الصنف */}
                <div className="font-semibold">{labelItem(it)}</div>
                <div className="text-white/70">{(it.price ?? 0).toString().padStart(3, '0')}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
