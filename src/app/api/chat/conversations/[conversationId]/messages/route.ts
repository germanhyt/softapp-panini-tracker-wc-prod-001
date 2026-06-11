import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getConversationMessages,
  markConversationRead,
  sendChatMessage,
} from '@/lib/chat/service'

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
    const messages = await getConversationMessages(session.user.id, conversationId)
    await markConversationRead(session.user.id, conversationId)
    return NextResponse.json({ messages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los mensajes'
    console.error('Chat messages error:', error)
    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { conversationId } = await context.params

  try {
    const body = (await request.json()) as { text?: string; clientId?: string }
    const message = await sendChatMessage({
      userId: session.user.id,
      conversationId,
      body: body.text || '',
      clientId: body.clientId,
    })
    return NextResponse.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje'
    console.error('Chat send error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
