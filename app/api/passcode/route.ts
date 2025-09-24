import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const code = sp.get('code')?.trim() ?? ''

  if (!code) return NextResponse.json({ error: 'Passcode required' }, { status: 400 })

  const adminPass  = process.env.ADMIN_PASS  || ''
  const editorPass = process.env.EDITOR_PASS || ''

  if (code === adminPass)  return NextResponse.json({ role: 'admin' })
  if (code === editorPass) return NextResponse.json({ role: 'editor' })

  return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
}
