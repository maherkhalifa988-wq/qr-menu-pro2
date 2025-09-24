import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QR Menu Pro',
  description: 'QR-based restaurant menu'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  )
}
