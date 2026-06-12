import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConversationPeer, userCanAccessConversation } from '@/lib/chat/service'
import { getChatTradeSuggestion } from '@/lib/chat/trade-suggestion'

type RouteContext = {
  params: Promise<{ conversationId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { conversationId } = await context.params

  try {
    const allowed = await userCanAccessConversation(session.user.id, conversationId)
    if (!allowed) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    const peer = await getConversationPeer(session.user.id, conversationId)
    if (!peer) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    const suggestion = await getChatTradeSuggestion(session.user.id, peer.id)
    return NextResponse.json({
      otherUserName: peer.displayName,
      suggestion,
    })
  } catch (error) {
    console.error('Trade suggestion error:', error)
    return NextResponse.json({ error: 'No se pudo calcular la sugerencia' }, { status: 500 })
  }
}
