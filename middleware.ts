// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_req: NextRequest) {
  // لا نفعل أي تحويل هنا؛ الحماية ستكون فقط عندما ينطبق الـmatcher أدناه
  return NextResponse.next()
}

// طبّق الـ middleware فقط على صفحات الإدارة والمحرر
export const config = {
  matcher: ['/admin/:path*', '/editor/:path*'],
}
