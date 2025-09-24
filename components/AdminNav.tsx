import Link from 'next/link'

export default function AdminNav() {
  return (
    <nav className="flex gap-3 mb-6">
      <Link className="btn-ghost" href="/">
        ⬅️ العودة
      </Link>
      <Link className="btn" href="/admin">
        لوحة الادارة
      </Link>
      <Link className="btn" href="/editor">
        محرر الاسعار
      </Link>
    </nav>
  )
}
