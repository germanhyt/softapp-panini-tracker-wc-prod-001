import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getMarketChatPreview } from '@/lib/chat/service'

type RouteContext = {
  params: Promise<{ otherUserId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { otherUserId } = await context.params

  if (!otherUserId || otherUserId === session.user.id) {
    return NextResponse.json({ error: 'Usuario inválido' }, { status: 400 })
  }

  try {
    const preview = await getMarketChatPreview(session.user.id, otherUserId)
    return NextResponse.json(preview)
  } catch (error) {
    console.error('Market chat preview error:', error)
    return NextResponse.json({ error: 'No se pudo cargar la vista previa' }, { status: 500 })
  }
}
