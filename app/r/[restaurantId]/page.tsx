'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import {
  collection, doc, getDoc, getDocs, orderBy, query
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
  catId?: string
  name?: string
  nameAr?: string
  nameEn?: string
  price?: number
  imageUrl?: string
  order?: number
}

/* ====== دوال تعقيم بسيطة تمنع الكراش وتطبع الحقول ====== */
function toStr(v: any, fallback = ''): string {
  if (v === null || v === undefined) return fallback
  try { return String(v) } catch { return fallback }
}
function numOrUndef(v: any): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}
function sanitizeCatsItems(rawCats: any[], rawItems: any[]): { cats: Cat[]; items: Item[] } {
  const cats: Cat[] = (Array.isArray(rawCats) ? rawCats : []).map((c: any, i: number) => ({
    id: toStr(c?.id ?? c?._id ?? i + 1),
    name: c?.name,
    nameAr: c?.nameAr ?? c?.titleAr ?? c?.ar ?? c?.name_ar,
    nameEn: c?.nameEn ?? c?.titleEn ?? c?.en ?? c?.name_en,
    imageUrl: c?.imageUrl ?? c?.img ?? c?.image,
    order: numOrUndef(c?.order),
  }))
  // حافظ على الترتيب إذا موجود
  cats.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999))

  const validCatIds = new Set(cats.map(c => c.id))

  const items: Item[] = (Array.isArray(rawItems) ? rawItems : [])
    .map((x: any, i: number) => {
      const catId = toStr(
        x?.catId ?? x?.categoryId ?? x?.category?.id ?? x?.category?._id ?? x?.cat_id ?? '',
      )
      return {
        id: toStr(x?.id ?? x?._id ?? i + 1),
        catId,
        name: x?.name,
        nameAr: x?.nameAr ?? x?.titleAr ?? x?.ar ?? x?.name_ar,
        nameEn: x?.nameEn ?? x?.titleEn ?? x?.en ?? x?.name_en,
        price: numOrUndef(x?.price),
        imageUrl: x?.imageUrl ?? x?.img ?? x?.image,
        order: numOrUndef(x?.order),
      } as Item
    })
    // تجاهل أي صنف لا يملك catId صحيحًا حتى لا يسبب كراش
    .filter((it: Item) => !!it.catId && validCatIds.has(it.catId!))

  items.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999))

  return { cats, items }
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

        // أصناف الجذر (لو موجودة)
        const qi = collection(db, 'restaurants', rid, 'items')
        const is = await getDocs(qi)

        if (!mounted) return

        // ✨ التعقيم قبل وضع الحالة
        const rawCats = cs.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        const rawItems = is.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

        const { cats: safeCats, items: safeItems } = sanitizeCatsItems(rawCats, rawItems)

        setCats(safeCats)
        setItemsRoot(safeItems)
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
      const rawNested = snap.docs.map(d => ({ id: d.id, ...(d.data() as any), catId }))
      // ✨ تعقيم أصناف المجموعة فقط
      const { items: safeNested } = sanitizeCatsItems(
        // نمرر المجموعات الحالية كي تتم التحقق من catId
        cats,
        rawNested
      )
      // إن وُجدت أصناف متداخلة نستخدمها؛ وإلا نتركها null كي نرجع للجذر
      setItemsForCat(safeNested.length ? safeNested : null)
    }
    if (rid && selectedCat) {
      setItemsForCat(null) // تصفير قبل الجلب
      loadNested(selectedCat)
    } else {
      setItemsForCat(null)
    }
    return () => { active = false }
  }, [rid, selectedCat, cats])

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
                  <div className="p-4 font-semibold">{labelCat(c)}</div>
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
                {labelCat(cats.find(c => c.id === selectedCat) || ({} as any))}
              </div>
            </div>

            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {itemsToShow.map(it => (
                <li key={it.id} className="card p-4 bg-black/30 backdrop-blur border border-white/10">
                  <div className="font-semibold">{labelItem(it)}</div>
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
  )
                      }
