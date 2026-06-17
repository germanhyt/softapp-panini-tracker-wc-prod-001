import { auth } from '@/auth'
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect('/mercado')

  return <AdminDashboardView adminEmail={session.user.email} />
}
