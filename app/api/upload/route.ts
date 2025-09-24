import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const cloud     = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey    = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloud || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary server ENV missing', present: {
          cloud: !!cloud, apiKey: !!apiKey, apiSecret: !!apiSecret
        }},
        { status: 500 }
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const folder    = 'qr-menu'
    const timestamp = Math.floor(Date.now() / 1000)

    // signature = sha1("folder=...&timestamp=..."+api_secret)
    const toSign    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = createHash('sha1').update(toSign).digest('hex')

    // فحص سريع
    if (new URL(req.url).searchParams.get('debug') === '1') {
      return NextResponse.json({ cloud, apiKeyPresent: !!apiKey, secretPresent: !!apiSecret, timestamp, toSign, signature })
    }

    const up = new FormData()
    up.append('file', file)
    up.append('api_key', apiKey)
    up.append('timestamp', String(timestamp))
    up.append('signature', signature)
    up.append('folder', folder)

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`
    const r   = await fetch(cloudUrl, { method: 'POST', body: up })
    const txt = await r.text()

    if (!r.ok) {
      console.error('CLOUDINARY_ERROR', r.status, txt)
      return NextResponse.json({ error: txt }, { status: r.status })
    }

    const json = JSON.parse(txt)
    const url = json?.secure_url as string | undefined
    if (!url) return NextResponse.json({ error: 'Upload OK but no secure_url' }, { status: 500 })

    return NextResponse.json({ url }, { status: 200 })
  } catch (e: any) {
    console.error('UPLOAD_API_ERROR', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const cloud     = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const ok = !!cloud && !!apiKey && !!apiSecret

  const u = new URL(req.url)
  if (u.searchParams.get('debug') === '1') {
    const timestamp = Math.floor(Date.now() / 1000)
    const toSign    = `folder=qr-menu&timestamp=${timestamp}${apiSecret ?? ''}`
    const signature = apiSecret ? createHash('sha1').update(toSign).digest('hex') : null
    return NextResponse.json({ ok, cloud, apiKeyPresent: !!apiKey, secretPresent: !!apiSecret, timestamp, toSign, signature }, { status: ok ? 200 : 500 })
  }

  return NextResponse.json({ ok }, { status: ok ? 200 : 500 })
}
