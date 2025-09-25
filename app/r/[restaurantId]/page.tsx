'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'

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
        // مطعم
        const rref = doc(db, 'restaurants', rid)
        const rsnap = await getDoc(rref)
        if (!mounted) return
        if (rsnap.exists()) {
          const r = rsnap.data() as any
          setName(r?.name ?? '')
          setLogoUrl(r?.logoUrl)
          setBgUrl(r?.bgUrl)
        }

        // مجموعات مرتبة
        const qc = query(collection(db, 'restaurants', rid, 'categories'), orderBy('order', 'asc'))
        const cs = await getDocs(qc)
        if (!mounted) return
        setCats(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })))

        // أصناف (متداخلة تحت كل مجموعة)
        const allItems: Item[] = []
        for (const c of cs.docs) {
          const qi = collection(db, 'restaurants', rid, 'categories', c.id, 'items')
          const is = await getDocs(qi)
          is.forEach(d => allItems.push({ id: d.id, catId: c.id, ...(d.data() as any) }))
        }
        if (!mounted) return
        setItems(allItems)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [rid])

  const filtered = useMemo(
    () => (selectedCat ? items.filter(i => i.catId === selectedCat) : []),
    [items, selectedCat]
  )

  if (loading) {
    return <main className="p-6">...جارٍ التحميل</main>
  }

  return (
    <>
      {/* خلفية تغطي الشاشة بالكامل + تعتيم + Blur خفيف */}
      <div className="fixed inset-0 -z-10">
        {bgUrl ? (
          <>
            <img
              src={bgUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-zinc-900 to-black" />
        )}
      </div>

      {/* المحتوى فوق الخلفية */}
      <main className="relative z-10 mx-auto max-w-6xl p-4 md:p-6">
        {/* الهيدر فوق الخلفية */}
        <header className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold drop-shadow">{name || 'القائمة'}</h1>
            {!selectedCat && <div className="text-white/70">المجموعات</div>}
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
                className="h-12 w-auto rounded-xl border border-white/10 bg-white/10 backdrop-blur"
              />
            ) : null}
          </div>
        </header>

        {/* المجموعات */}
        {!selectedCat && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cats.map(c => (
              <button
                key={c.id}
                className="overflow-hidden text-left rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 backdrop-blur-md shadow-xl transition"
                onClick={() => setSelectedCat(c.id)}
                title="افتح المجموعة"
              >
                <div className="relative h-40 w-full">
                  {c.imageUrl ? (
                    <>
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/35" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                <div className="p-4 font-semibold">{labelCat(c)}</div>
              </button>
            ))}
          </div>
        )}

        {/* الأصناف داخل مجموعة */}
        {selectedCat && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button
                className="btn-ghost"
                onClick={() => setSelectedCat(null)}
              >
                ← رجوع للمجموعات
              </button>
              <div className="text-white/80 font-medium">
                {labelCat(cats.find(c => c.id === selectedCat) || ({} as any))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-white/70">لا توجد أصناف في هذه المجموعة</div>
            ) : (
              <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map(it => (
                  <li
                    key={it.id}
                    className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-4 shadow-xl"
                  >
                    <div className="font-semibold">{labelItem(it)}</div>
                    <div className="text-white/60">
                      {(it.price ?? 0).toString().padStart(3, '0')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  )
}
