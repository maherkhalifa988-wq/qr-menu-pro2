'use client'
import { QRCodeCanvas } from 'qrcode.react'

export default function QRCard({ url }: { url: string }) {
  return (
    <div className="card p-4 flex flex-col items-center">
      <h3 className="font-bold mb-2">رمز QR</h3>
      <QRCodeCanvas value={url} size={180} />
      <p className="text-sm text-white/60 mt-2">{url}</p>
    </div>
  )
}
