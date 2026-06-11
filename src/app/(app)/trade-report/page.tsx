import { auth } from '@/auth'
import { loadSessionUser } from '@/lib/auth/session-user'
import { TradeReportView } from '@/components/reports/trade-report-view'

export default async function TradeReportPage() {
  const session = await auth()
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null

  return (
    <TradeReportView
      displayName={user?.displayName ?? 'Coleccionista'}
      email={user?.email ?? session?.user?.email ?? ''}
    />
  )
}
