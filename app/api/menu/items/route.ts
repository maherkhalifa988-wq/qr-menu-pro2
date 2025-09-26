// app/api/menu/items/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rid = searchParams.get('rid')?.trim()
    const catId = searchParams.get('catId')?.trim()
    if (!rid || !catId) return NextResponse.json({ error: 'Missing rid or catId' }, { status: 400 })

    const snap = await adminDb
      .collection('restaurants').doc(rid)
      .collection('categories').doc(catId)
      .collection('items')
      .get()

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e:any) {
    console.error('API_MENU_ITEMS_ERROR', e)
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}
