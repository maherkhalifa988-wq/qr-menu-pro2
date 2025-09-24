import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    cloud:  process.env.CLOUDINARY_CLOUD_NAME,
    api:    !!process.env.CLOUDINARY_API_KEY,
    secret: !!process.env.CLOUDINARY_API_SECRET,
  })
}
