import { auth } from '@/auth'
import { loadSessionUser } from '@/lib/auth/session-user'
import { VisualReportView } from '@/components/reports/visual-report-view'

export default async function VisualReportPage() {
  const session = await auth()
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null

  return <VisualReportView displayName={user?.displayName ?? 'Coleccionista'} />
}
