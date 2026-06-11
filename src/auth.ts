import NextAuth from 'next-auth'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { cookies } from 'next/headers'
import { CredentialsSignin } from '@auth/core/errors'
import { prisma } from '@/lib/db/prisma'
import { comparePassword } from '@/lib/auth/password'
import { ensureGoogleProfile, loadSessionUser } from '@/lib/auth/session-user'
import { normalizeEmail } from '@/lib/auth/users'

class EmailNotVerifiedError extends CredentialsSignin {
  code = 'email_not_verified'
}

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

function applySessionToken(session: Session, token: JWT) {
  if (session.user && token.sub) {
    session.user.id = token.sub
    session.user.email = session.user.email || (typeof token.email === 'string' ? token.email : '')
    session.user.emailVerified = Boolean(token.emailVerified)
    session.user.profileComplete = Boolean(token.profileComplete)
    session.user.isAdmin = Boolean(token.isAdmin)
  }
  return session
}

const initAuth = NextAuth as (config: object) => {
  handlers: { GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> }
  auth: () => Promise<Session | null>
  signIn: (...args: unknown[]) => Promise<unknown>
  signOut: (options?: { redirectTo?: string }) => Promise<void>
}

export const { handlers, auth, signIn, signOut } = initAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = normalizeEmail(String(credentials?.email || ''))
        const password = String(credentials?.password || '')

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        if (!user.emailVerified) throw new EmailNotVerifiedError()

        const valid = await comparePassword(password, user.passwordHash)
        if (!valid) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: { id?: string; email?: string | null; name?: string | null; image?: string | null }
      account?: { provider?: string } | null
    }) {
      if (account?.provider !== 'google' || !user.email || !user.id) {
        return true
      }

      const cookieStore = await cookies()
      const intent = cookieStore.get('auth_intent')?.value || 'login'
      cookieStore.delete('auth_intent')

      const email = normalizeEmail(user.email)
      const googleAccount = await prisma.account.findFirst({
        where: { provider: 'google', user: { email } },
      })

      if (intent === 'login' && !googleAccount) {
        return '/login?error=GoogleNotRegistered'
      }

      await ensureGoogleProfile(user.id, user.email, user.name, user.image)
      return true
    },
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT
      user?: { id?: string }
      trigger?: 'update'
    }) {
      const userId = user?.id || token.sub
      if (!userId) return token

      if (user || trigger === 'update') {
        const dbUser = await loadSessionUser(userId)
        if (dbUser) {
          token.sub = dbUser.id
          token.emailVerified = dbUser.emailVerified
          token.profileComplete = dbUser.profileComplete
          token.isAdmin = dbUser.isAdmin
          token.name = dbUser.displayName
        }
      }

      return token
    },
    session({ session, token }: { session: Session; token: JWT }) {
      return applySessionToken(session, token)
    },
  },
})
