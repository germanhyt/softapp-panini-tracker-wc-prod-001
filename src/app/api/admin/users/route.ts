import { NextResponse } from 'next/server'
import { buildAdminSummary, listAdminUsers } from '@/lib/admin/service'
import { requireAdminSession } from '@/lib/auth/require-admin'

export async function GET() {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const users = await listAdminUsers()
    return NextResponse.json({
      users,
      summary: buildAdminSummary(users),
    })
  } catch (err) {
    console.error('Admin users error:', err)
    return NextResponse.json({ error: 'No se pudo cargar el panel administrador' }, { status: 500 })
  }
}
