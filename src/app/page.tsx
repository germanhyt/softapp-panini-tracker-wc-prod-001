import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getHomeRouteForUser } from '@/lib/auth/home-route'

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!session.user.emailVerified) {
    redirect('/verify-email')
  }

  if (!session.user.profileComplete) {
    redirect('/complete-profile')
  }

  redirect(getHomeRouteForUser(Boolean(session.user.isAdmin)))
}
