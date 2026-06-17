import { auth } from '@/auth'
import { loadSessionUser } from '@/lib/auth/session-user'
import { getPrimaryCompanyUserId } from '@/lib/chat/policy'
import { PlayBarHubView } from '@/components/matches/play-bar-hub-view'

export default async function MatchesPage() {
  const session = await auth()
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null
  const companyUserId = await getPrimaryCompanyUserId()

  return (
    <PlayBarHubView
      countryCode={user?.countryCode ?? null}
      companyUserId={companyUserId}
      isAdmin={Boolean(session?.user?.isAdmin)}
    />
  )
}
