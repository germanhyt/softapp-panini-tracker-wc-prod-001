import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { consumeEmailVerificationToken } from '@/lib/auth/email-verification'
import { getAppBaseUrlFromRequest } from '@/lib/app-url'

export async function GET(request: Request) {
  const baseUrl = getAppBaseUrlFromRequest(request)
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing', baseUrl))
  }

  const email = await consumeEmailVerificationToken(token)
  if (!email) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', baseUrl))
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  return NextResponse.redirect(new URL('/login?verified=1', baseUrl))
}
