'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc
} from 'firebase/firestore'
import  uploadImage  from '@/lib/uploadImage' // تأكد من الاسم

type Cat = { id: string; name?: string; nameAr?: string; nameEn?: string }
type Item = { id: string; name?: string; nameAr?: string; nameEn?: string; price?: number; catId: string; imageUrl?: string }

export default function AdminItemsManager({ rid }: { rid: string }) {
  const [cats, setCats] = useState<Cat[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [newItem, setNewItem] = useState<{catId:string; nameAr:string; nameEn:string; price:number; file?: File}>({
    catId:'', nameAr:'', nameEn:'', price:0
  })

  const labelCat  = (c: Cat)  => (c.name||c.nameAr||c.nameEn) || 'بدون اسم'
  const labelItem = (i: Item) => (i.name||i.nameAr||i.nameEn) || 'بدون اسم'

  async function loadAll() {
    const qc = query(collection(db,'restaurants',rid,'categories'), orderBy('order','asc'))
    const catsSnap = await getDocs(qc)
    const loadedCats = catsSnap.docs.map(d=>({ id:d.id, ...(d.data() as any) }))
    setCats(loadedCats)
    if (loadedCats[0] && !newItem.catId) setNewItem(s=>({...s, catId:loadedCats[0].id}))

    const iSnap = await getDocs(collection(db,'restaurants',rid,'items'))
    setItems(iSnap.docs.map(d=>({ id:d.id, ...(d.data() as any) })))
  }
  useEffect(()=>{ loadAll() }, [rid])

  async function addItem() {
    if (!newItem.catId || (!newItem.nameAr && !newItem.nameEn)) { alert('اكمل الحقول'); return }
    setBusy(true)
    try {
      // ارفع الصورة أولاً إن وُجدت
      let imageUrl = ''
      if (newItem.file) {
        imageUrl = await uploadImage(newItem.file,'restaurants/'+rid+'/items')
      }

      await addDoc(collection(db,'restaurants',rid,'items'), {
        catId: newItem.catId,
        name: newItem.nameAr || newItem.nameEn,
        nameAr: newItem.nameAr,
        nameEn: newItem.nameEn,
        price: Number(newItem.price)||0,
        imageUrl,
        createdAt: Date.now(),
        order: 0,
      })
      setNewItem({ catId:newItem.catId, nameAr:'', nameEn:'', price:0, file:undefined })
      await loadAll()
    } finally { setBusy(false) }
  }

  async function removeItem(id:string) {
    if (!confirm('حذف الصنف نهائيًا؟')) return
    setBusy(true)
    try {
      await deleteDoc(doc(db,'restaurants',rid,'items',id))
      setItems(prev=>prev.filter(x=>x.id!==id))
    } finally { setBusy(false) }
  }

  async function updatePrice(id:string, price:number) {
    await updateDoc(doc(db,'restaurants',rid,'items',id), { price:Number(price)||0 })
  }

  async function changeItemImage(it: Item, file: File) {
    setBusy(true)
    try {
      const url = await uploadImage(file, 'restaurants/'+rid+'/items')
      await updateDoc(doc(db,'restaurants',rid,'items',it.id), { imageUrl: url })
      await loadAll()
    } finally { setBusy(false) }
  }

  return (
    <section className="card p-5 my-6">
      <h3 className="font-bold mb-3">إدارة الأصناف</h3>

      {/* إضافة صنف */}
      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <select className="input" value={newItem.catId}
          onChange={e=>setNewItem(s=>({...s, catId:e.target.value}))}>
          {cats.map(c=><option key={c.id} value={c.id}>{labelCat(c)}</option>)}
        </select>
        <input className="input" placeholder="الاسم (عربي)" value={newItem.nameAr}
          onChange={e=>setNewItem(s=>({...s, nameAr:e.target.value}))}/>
        <input className="input" placeholder="Name (English)" value={newItem.nameEn}
          onChange={e=>setNewItem(s=>({...s, nameEn:e.target.value}))}/>
        <input className="input" type="number" placeholder="السعر" value={newItem.price}
onChange={e=>setNewItem(s=>({...s, price:Number(e.target.value)}))}/>
        <div className="flex items-center gap-2">
          <label className="btn-ghost cursor-pointer">
            صورة
            <input type="file" accept="image/*" hidden
              onChange={e=>setNewItem(s=>({...s, file:e.target.files?.[0]}))}/>
          </label>
          <button className="btn" onClick={addItem} disabled={busy}>{busy?'...':'إضافة'}</button>
        </div>
      </div>

      {/* قائمة الأصناف */}
      <ul className="space-y-3">
        {items.map(it=>(
          <li key={it.id} className="flex items-center gap-3">
            {/* صورة مصغّرة */}
            {it.imageUrl
              ? <img src={it.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
              : <div className="h-12 w-12 rounded bg-white/10" />
            }

            {/* الاسم */}
            <span className="grow">{labelItem(it)}</span>

            {/* تعديل السعر */}
            <input
              className="input max-w-24 text-right"
              type="number"
              defaultValue={it.price ?? 0}
              onBlur={(e)=>updatePrice(it.id, Number(e.target.value))}
              title="غيّر السعر ثم اخرج من الحقل للحفظ"
            />

            {/* تغيير الصورة */}
            <label className="btn-ghost cursor-pointer">
              تغيير الصورة
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e=>e.target.files?.[0] && changeItemImage(it, e.target.files[0])}
              />
            </label>

            {/* حذف */}
            <button className="btn-ghost" onClick={()=>removeItem(it.id)} disabled={busy}>
              حذف
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
