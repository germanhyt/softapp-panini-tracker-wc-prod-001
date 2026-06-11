import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { authConfig } from '@/auth.config'

const initAuth = NextAuth as (config: object) => {
  auth: (
    handler: (req: { auth: Session | null; nextUrl: URL; url: string }) => Response | NextResponse | void,
  ) => (req: Request) => Promise<Response>
}

const { auth } = initAuth(authConfig)

const appRoutes = ['/dashboard', '/album', '/matches', '/chat', '/profile', '/admin', '/extras', '/visual-report', '/trade-report']

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  const isAppRoute = appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (!session?.user) {
    if (isAppRoute || pathname === '/complete-profile') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (!session.user.emailVerified && pathname !== '/verify-email') {
    return NextResponse.redirect(new URL('/verify-email', req.url))
  }

  if (
    session.user.emailVerified &&
    !session.user.profileComplete &&
    pathname !== '/complete-profile'
  ) {
    if (isAppRoute) {
      return NextResponse.redirect(new URL('/complete-profile', req.url))
    }
  }

  if (session.user.profileComplete && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/album/:path*',
    '/matches/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/extras/:path*',
    '/visual-report/:path*',
    '/trade-report/:path*',
    '/complete-profile',
    '/verify-email',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
}
