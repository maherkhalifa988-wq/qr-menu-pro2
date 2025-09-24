'use client'
import { useState } from 'react'

export default function ImageUploader() {
  const [url, setUrl] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      const base64 = reader.result
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64 }),
      })
      const json = await res.json()
      setUrl(json.url)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {url && (
        <div className="mt-2">
          <p>تم الرفع بنجاح:</p>
          <img src={url} alt="Uploaded" width={200} />
        </div>
      )}
    </div>
  )
}
