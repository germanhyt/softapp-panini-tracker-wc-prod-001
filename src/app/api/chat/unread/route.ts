import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTotalUnreadCount } from '@/lib/chat/service'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const totalUnread = await getTotalUnreadCount(session.user.id)
    return NextResponse.json({ totalUnread })
  } catch (error) {
    console.error('Chat unread error:', error)
    return NextResponse.json({ error: 'No se pudo cargar el contador' }, { status: 500 })
  }

}
