import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { findMatchesForUser } from '@/lib/matches/service'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await findMatchesForUser(session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Matches error:', error)
    return NextResponse.json({ error: 'No se pudieron calcular los matches' }, { status: 500 })
  }
}
