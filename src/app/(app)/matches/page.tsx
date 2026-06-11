import { auth } from '@/auth'
import { loadSessionUser } from '@/lib/auth/session-user'
import { MatchFinderView } from '@/components/matches/match-finder-view'

export default async function MatchesPage() {
  const session = await auth()
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null

  return (
    <MatchFinderView countryCode={user?.countryCode ?? null} myDisplayName={user?.displayName ?? 'un coleccionista'} />
  )
}
