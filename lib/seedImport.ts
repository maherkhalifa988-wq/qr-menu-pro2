import { db } from '@/lib/firebase'
import { doc, setDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore'

/** يستورد مجموعات/أصناف مطعم النخيل (سعر 0) إلى Firestore */
export async function importSeedForAlNakheel() {
  const data = await fetch('/data/seed_al_nakheel.json').then(r => r.json())

  const rid: string = data.restaurantId
  const name: string = data.restaurantName
  const defaultPrice: number = data.defaultPrice ?? 0

  const ccol = collection(doc(db, 'restaurants', rid), 'categories')
  const icol = collection(doc(db, 'restaurants', rid), 'items')

  // تفريغ القديم
  const [cc, ii] = await Promise.all([getDocs(ccol), getDocs(icol)])
  await Promise.all(cc.docs.map(d => deleteDoc(d.ref)))
  await Promise.all(ii.docs.map(d => deleteDoc(d.ref)))

  // المطعم
  await setDoc(doc(db, 'restaurants', rid), { name, isActive: true }, { merge: true })

  // المجموعات + الاصناف
  let order = 1
  for (const cat of data.categories as any[]) {
    const cref = await addDoc(ccol, { nameAr: cat.nameAr, nameEn: cat.nameEn || '', order })
    order++
    let iorder = 1
    for (const itemName of (cat.items || [])) {
      await addDoc(icol, {
        nameAr: itemName,
        nameEn: '',
        price: defaultPrice,
        imageUrl: '',
        categoryId: cref.id,
        available: true,
        order: iorder
      })
      iorder++
    }
  }
  return { ok: true }
}
