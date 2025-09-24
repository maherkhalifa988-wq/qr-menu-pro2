'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection, collectionGroup, getDocs, doc, setDoc, deleteDoc
} from 'firebase/firestore'

const RID = 'al-nakheel' // عدّلها حسب معرّف مطعمك

export default function MigrateItemsPage() {
  const [log, setLog] = useState<string[]>([])
  const push = (m:string)=>setLog(x=>[m,...x])

  async function migrateFlatToNested() {
    push('بدء نسخ الأصناف المسطّحة إلى المجموعات…')
    const flat = await getDocs(collection(db, 'restaurants', RID, 'items'))
    for (const d of flat.docs) {
      const data = d.data() as any
      const catId = data.catId
      if (!catId) { push(`⚠️ عنصر ${d.id} بلا catId — تخطّي`); continue }
      const dst = doc(db, 'restaurants', RID, 'categories', catId, 'items', d.id)
      await setDoc(dst, { ...data, updatedAt: Date.now() }, { merge: true })
      await deleteDoc(d.ref)
      push(`✔ نقل ${d.id} → category ${catId}`)
    }
    push('انتهت الهجرة.')
  }

  async function checkNested() {
    const cg = collectionGroup(db, 'items')
    const all = await getDocs(cg)
    const mine = all.docs.filter(d => d.ref.path.includes(/restaurants/${RID}/categories/))
    push(عناصر متداخلة تخص ${RID}: ${mine.length})
  }

  return (
    <main className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">هجرة الأصناف</h1>
      <div className="flex gap-2">
        <button className="btn" onClick={migrateFlatToNested}>نسخ العناصر المسطّحة → المتداخلة</button>
        <button className="btn-ghost" onClick={checkNested}>فحص العناصر المتداخلة</button>
      </div>
      <pre className="text-sm whitespace-pre-wrap bg-black/30 p-3 rounded">{log.join('\n')}</pre>
    </main>
  )
}
