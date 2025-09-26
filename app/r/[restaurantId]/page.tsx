'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
  collection, doc, getDoc, getDocs, orderBy, query
} from 'firebase/firestore'
import { SafeBoundary } from '@/app/components/SafeBoundary' // 👈 إضافـة

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
  catId?: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
  order?: number
}

export default function RestaurantPublicPage() {
  const params = useParams() as { restaurantId?: string } | null
  const rid = params?.restaurantId ?? ''

  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [bgUrl, setBgUrl] = useState<string | undefined>()

  const [cats, setCats] = useState<Cat[]>([])
  const [itemsRoot, setItemsRoot] = useState<Item[]>([])     // أصناف الجذر
  const [itemsForCat, setItemsForCat] = useState<Item[]|null>(null) // أصناف المسار المتداخل للمجموعة المختارة
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  const labelCat = (c: Cat) =>
    (lang === 'ar' ? (c.nameAr||c.name) : (c.nameEn||c.name)) || 'بدون اسم'
  const labelItem = (i: Item) =>
    (lang === 'ar' ? (i.nameAr||i.name) : (i.nameEn||i.name)) || 'بدون اسم'

  // تحميل بيانات المطعم + المجموعات + أصناف الجذر
  useEffect(() => {
    let mounted = true
    if (!rid) return
    ;(async () => {
      try {
        // المطعم
        const rref = doc(db, 'restaurants', rid)
        const rsnap = await getDoc(rref)
        if (!mounted) return
        if (rsnap.exists()) {
          const r = rsnap.data() as any
          setName(r?.name ?? '')
          setLogoUrl(r?.logoUrl)
          setBgUrl(r?.bgUrl)
        }

        // المجموعات مرتبة
        const qc = query(
          collection(db, 'restaurants', rid, 'categories'),
          orderBy('order', 'asc')
        )
        const cs = await getDocs(qc)
        if (!mounted) return
        setCats(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })))

        // أصناف الجذر (لو موجودة)
        const qi = collection(db, 'restaurants', rid, 'items')
        const is = await getDocs(qi)
        if (!mounted) return
        setItemsRoot(is.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [rid])

  // عند اختيار مجموعة: حاول جلب أصناف المسار المتداخل لتلك المجموعة
  useEffect(() => {
    let active = true
    async function loadNested(catId: string) {
      // أصناف تحت: restaurants/{rid}/categories/{catId}/items
      const nestedCol = collection(db, 'restaurants', rid, 'categories', catId, 'items')
      const snap = await getDocs(nestedCol)
      if (!active) return
      const nestedItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any), catId }))
      // إن وُجدت أصناف متداخلة نستخدمها؛ وإلا نتركها null كي نرجع للجذر
      setItemsForCat(nestedItems.length ? nestedItems : null)
    }
    if (rid && selectedCat) {
      setItemsForCat(null) // تصفير قبل الجلب
      loadNested(selectedCat)
    } else {
      setItemsForCat(null)
    }
    return () => { active = false }
  }, [rid, selectedCat])

  // لو لم نجد أصناف متداخلة للمجموعة المختارة، نرجع لتصفية أصناف الجذر بـ catId
  const fallbackFiltered = useMemo(
    () => (selectedCat ? itemsRoot.filter(i => i.catId === selectedCat) : []),
    [itemsRoot, selectedCat]
  )

  const itemsToShow = selectedCat
    ? (itemsForCat ?? fallbackFiltered)
    : []

  if (loading) {
    return <main className="container mx-auto p-6">...جارٍ التحميل</main>
  }

  return (
    <SafeBoundary>
      <>
        {/* خلفية تغطي كامل الصفحة + تعتيم خفيف */}
        {bgUrl && (
          <div className="fixed inset-0 -z-10">
            <img
              src={bgUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        <main className="container mx-auto p-6 relative z-10">
          {/* ترويسة شفافة فوق الخلفية */}
          <header className="mb-6 flex items-center justify-between rounded-xl bg-black/30 backdrop-blur p-4 border border-white/10">
            <div className="text-right">
              <h1 className="text-2xl font-bold">{name || 'القائمة'}</h1>
            </div>
            <div className="flex items-center gap-3">
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
          </header>

          {/* المجموعات */}
          {!selectedCat && (
            <>
              <h2 className="font-bold mb-3">المجموعات</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cats.map(c => (
                  <button
                    key={c.id}
                    className="card overflow-hidden text-left bg-black/30 backdrop-blur border border-white/10"
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
                    <div className="p-4 font-semibold">{(lang === 'ar' ? (c.nameAr||c.name) : (c.nameEn||c.name)) || 'بدون اسم'}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* الأصناف */}
          {selectedCat && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button className="btn-ghost" onClick={() => setSelectedCat(null)}>← رجوع للمجموعات</button>
                <div className="text-white/90 font-semibold">
                  {(lang === 'ar'
                    ? (cats.find(c => c.id === selectedCat)?.nameAr || cats.find(c => c.id === selectedCat)?.name)
                    : (cats.find(c => c.id === selectedCat)?.nameEn || cats.find(c => c.id === selectedCat)?.name)) || 'بدون اسم'}
                </div>
              </div>

              <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {itemsToShow.map(it => (
                  <li key={it.id} className="card p-4 bg-black/30 backdrop-blur border border-white/10">
                    <div className="font-semibold">
                      {(lang === 'ar' ? (it.nameAr||it.name) : (it.nameEn||it.name)) || 'بدون اسم'}
                    </div>
                    <div className="text-white/80">
                      {typeof it.price === 'number' ? it.price.toFixed(2) : ''}
                    </div>
                  </li>
                ))}
                {itemsToShow.length === 0 && (
                  <li className="text-white/80">لا توجد أصناف في هذه المجموعة.</li>
                )}
              </ul>
            </>
          )}
        </main>
      </>
    </SafeBoundary>
  )
}
