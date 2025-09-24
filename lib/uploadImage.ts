// lib/uploadImage.ts
// يرفع دائمًا عبر مسار السيرفر /api/upload (موقّع)، لا يحتاج NEXT_PUBLIC_*.

export default async function uploadImage(file: File, folder?: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  if (folder) fd.append('folder', folder)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const text = await res.text()

  let data: any = null
  try { data = JSON.parse(text) } catch {}

  if (!res.ok) {
    throw new Error(data?.error || text || `HTTP ${res.status}`)
  }
  const url = data?.url as string | undefined
  if (!url) throw new Error('Upload OK but no URL returned')
  return url
}
