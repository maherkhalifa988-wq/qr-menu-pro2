'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query
} from 'firebase/firestore'
import  uploadImage  from '@/lib/uploadImage'

type Cat = { id:string; name?:string; nameAr?:string; nameEn?:string; order?:number; imageUrl?:string }

export default function AdminCategoriesManager({ rid }: { rid:string }) {
  const [cats, setCats] = useState<Cat[]>([])
  const [busy, setBusy] = useState(false)
  const [newCat, setNewCat] = useState<{nameAr:string; nameEn:string; order:number; file?:File}>({
    nameAr:'', nameEn:'', order:0
  })

  const labelCat = (c:Cat) => (c.name || c.nameAr || c.nameEn) || 'بدون اسم'

  async function load() {
    const qs = await getDocs(query(collection(db,'restaurants',rid,'categories'), orderBy('order','asc')))
    setCats(qs.docs.map(d=>({ id:d.id, ...(d.data() as any) })))
  }
  useEffect(()=>{ load() }, [rid])

  async function addCat() {
    if (!newCat.nameAr && !newCat.nameEn) { alert('اكتب اسم المجموعة'); return }
    setBusy(true)
    try {
      let imageUrl = ''
      if (newCat.file) imageUrl = await uploadImage(newCat.file,'restaurants/'+rid+'/categories')
      await addDoc(collection(db,'restaurants',rid,'categories'), {
        name: newCat.nameAr || newCat.nameEn,
        nameAr: newCat.nameAr,
        nameEn: newCat.nameEn,
        order: Number(newCat.order)||0,
        imageUrl,
        createdAt: Date.now(),
      })
      setNewCat({ nameAr:'', nameEn:'', order:0, file:undefined })
      await load()
    } finally { setBusy(false) }
  }

  async function changeImage(c:Cat, file:File) {
    setBusy(true)
    try {
      const url = await uploadImage(file,'restaurants/'+rid+'/categories')
      await updateDoc(doc(db,'restaurants',rid,'categories',c.id), { imageUrl:url })
      await load()
    } finally { setBusy(false) }
  }

  async function removeCat(id:string) {
    if (!confirm('حذف المجموعة؟ لن تُحذف الأصناف تلقائيًا.')) return
    setBusy(true)
    try {
      await deleteDoc(doc(db,'restaurants',rid,'categories',id))
      setCats(prev=>prev.filter(x=>x.id!==id))
    } finally { setBusy(false) }
  }

  return (
    <section className="card p-5 my-6">
      <h3 className="font-bold mb-3">إدارة المجموعات</h3>

      {/* إضافة مجموعة */}
      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <input className="input" placeholder="اسم عربي" value={newCat.nameAr}
               onChange={e=>setNewCat(s=>({...s, nameAr:e.target.value}))}/>
        <input className="input" placeholder="English Name" value={newCat.nameEn}
               onChange={e=>setNewCat(s=>({...s, nameEn:e.target.value}))}/>
        <input className="input" type="number" placeholder="الترتيب" value={newCat.order}
               onChange={e=>setNewCat(s=>({...s, order:Number(e.target.value)}))}/>
        <label className="btn-ghost cursor-pointer">
          صورة
          <input hidden type="file" accept="image/*"
                 onChange={e=>setNewCat(s=>({...s, file:e.target.files?.[0]}))}/>
        </label>
        <button className="btn" onClick={addCat} disabled={busy}>{busy?'...':'إضافة'}</button>
      </div>

      {/* القائمة */}
      <ul className="space-y-3">
        {cats.map(c=>(
          <li key={c.id} className="flex items-center gap-3">
            {c.imageUrl
              ? <img src={c.imageUrl} className="h-12 w-12 rounded object-cover" alt="" />
              : <div className="h-12 w-12 rounded bg-white/10" />
            }
            <span className="grow">{labelCat(c)}</span>
            <label className="btn-ghost cursor-pointer">
              تغيير الصورة
              <input hidden type="file" accept="image/*"
                     onChange={e=>e.target.files?.[0] && changeImage(c, e.target.files[0])}/>
            </label>
            <button className="btn-ghost" onClick={()=>removeCat(c.id)} disabled={busy}>حذف</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
