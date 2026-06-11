import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export const authConfig = {
  session: { strategy: 'jwt' as const },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.email = session.user.email || (typeof token.email === 'string' ? token.email : '')
        session.user.emailVerified = Boolean(token.emailVerified)
        session.user.profileComplete = Boolean(token.profileComplete)
        session.user.isAdmin = Boolean(token.isAdmin)
      }
      return session
    },
  },
}
