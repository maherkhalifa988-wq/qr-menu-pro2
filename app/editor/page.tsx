// app/editor/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// ⚠️ لا نستورد AdminBrandSection هنا
import PriceEditor from './PriceEditor' // تأكد أن الملف موجود ويستقبل prop rid

const RID = 'al-nakheel' // عدّلها إن لزم

export default function EditorPage() {
  const router = useRouter()

  // إن كنت تريد تقييد الدخول للمحرر حسب الدور المخزن محليًا:
  useEffect(() => {
    try {
      const role = typeof window !== 'undefined' ? localStorage.getItem('qrmenu_role') : null
      if (role !== 'editor' && role !== 'admin') {
        // اعمل Redirect لصفحة الدخول أو الرئيسية
        router.replace('/')
      }
    } catch {
      router.replace('/')
    }
  }, [router])

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">محرر الأسعار</h1>
      {/* نمرر فقط معرف المطعم للمحرر */}
      <PriceEditor rid={RID} />
    </main>
  )
}
