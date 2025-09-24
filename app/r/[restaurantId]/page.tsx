'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'

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
}

export default function RestaurantPublicPage() {
  const params = useParams() as { restaurantId?: string } | null
  const rid = params?.restaurantId ?? ''

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [bgUrl, setBgUrl] = useState<string | undefined>()
  const [cats, setCats] = useState<Cat[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  const labelCat = (c: Cat) =>
    (lang === 'ar' ? (c.nameAr||c.name) : (c.nameEn||c.name)) || 'بدون اسم'
  const labelItem = (i: Item) =>
    (lang === 'ar' ? (i.nameAr||i.name) : (i.nameEn||i.name)) || 'بدون اسم'

  useEffect(() => {
    let mounted = true
    if (!rid) return
    ;(async () => {
      try {
        // بيانات المطعم
        const rref = doc(db, 'restaurants', rid)
        const rsnap = await getDoc(rref)
        if (!mounted) return
        if (rsnap.exists()) {
          const r = rsnap.data() as any
          setName(r?.name ?? '')
          setLogoUrl(r?.logoUrl)
          setBgUrl(r?.bgUrl)
        }

        // المجموعات (مرتبة)
        const qc = query(collection(db, 'restaurants', rid, 'categories'), orderBy('order', 'asc'))
        const cs = await getDocs(qc)
        if (!mounted) return
        setCats(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })))

        // الأصناف من كل المجموعات عبر collectionGroup('items')
        const cg = collectionGroup(db, 'items')
        const all = await getDocs(cg)
        if (!mounted) return
        const myItems = all.docs
          // نتأكد أن العنصر ضمن المطعم الحالي
          .filter(d => d.ref.path.includes(`/restaurants/${rid}/categories/`))
          .map(d => {
            const catId = d.ref.parent.parent?.id || ''
            return { id: d.id, catId, ...(d.data() as any) }
          })
        setItems(myItems)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [rid])

  const filtered = useMemo(
    () => (selectedCat ? items.filter(i => i.catId === selectedCat) : []),
    [items, selectedCat]
  )

  if (loading) {
    return <main className="container mx-auto p-6">...جارٍ التحميل</main>
  }

  return (
    <main className="relative min-h-screen">
      {/* خلفية تغطي الصفحة */}
      {bgUrl && (
        <div className="fixed inset-0 -z-10">
          <img src={bgUrl} alt="" className="h-full w-full object-cover pointer-events-none" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-bold">{name || 'القائمة'}</h1>
          </div>
          <div className="flex items-center gap-2">
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
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-auto rounded-lg border border-white/10 bg-white/10 backdrop-blur"
              />
            ) : null}
          </div>
        </div>

        {!selectedCat && (
          <>
            <h2 className="font-bold mb-3">المجموعات</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cats.map(c => (
                <button
                  key={c.id}
                  className="card overflow-hidden text-left bg-black/30 backdrop-blur"
                  onClick={() => setSelectedCat(c.id)}
                  title="افتح المجموعة"
                >
                  <div className="relative h-36 w-full bg-white/5">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/60">
                        لا توجد صورة
                      </div>
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
              <button className="btn-ghost" onClick={() => setSelectedCat(null)}>
                ← رجوع للمجموعات
              </button>
              <div className="text-white/80 font-semibold">
                {labelCat(cats.find(c => c.id === selectedCat) || ({} as any))}
              </div>
            </div>

            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.length === 0 && (
                <li className="text-white/70">لا توجد أصناف في هذه المجموعة.</li>
              )}
              {filtered.map(it => (
                <li key={it.id} className="card p-4 bg-black/30 backdrop-blur">
                  <div className="font-semibold">{labelItem(it)}</div>
                  <div className="text-white/70">{(it.price ?? 0).toString().padStart(3, '0')}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}
