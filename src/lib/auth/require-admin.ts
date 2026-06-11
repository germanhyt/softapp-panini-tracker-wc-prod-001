import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function requireAdminSession() {
  const session = await auth()

  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  if (!session.user.isAdmin) {
    return { session: null, error: NextResponse.json({ error: 'Prohibido' }, { status: 403 }) }
  }

  return { session, error: null }
}
