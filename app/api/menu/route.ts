// app/api/menu/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rid = searchParams.get('rid')?.trim()
    if (!rid) return NextResponse.json({ error: 'Missing rid' }, { status: 400 })

    const rdoc = await adminDb.collection('restaurants').doc(rid).get()
    if (!rdoc.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const restaurant = rdoc.data() || {}

    const catsSnap = await adminDb
      .collection('restaurants').doc(rid)
      .collection('categories')
      .orderBy('order', 'asc')
      .get()
    const categories = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const itemsSnap = await adminDb
      .collection('restaurants').doc(rid)
      .collection('items')
      .get()
    const itemsRoot = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ restaurant, categories, itemsRoot }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('API_MENU_ERROR', e)
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}
