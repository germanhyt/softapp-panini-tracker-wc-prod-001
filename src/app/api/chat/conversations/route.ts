import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { findOrCreateDirectConversation, listConversationsForUser } from '@/lib/chat/service'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const conversations = await listConversationsForUser(session.user.id)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Chat list error:', error)
    return NextResponse.json({ error: 'No se pudieron cargar las conversaciones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { participantUserId?: string }
    const participantUserId = body.participantUserId?.trim()

    if (!participantUserId) {
      return NextResponse.json({ error: 'Usuario destino requerido' }, { status: 400 })
    }

    const conversationId = await findOrCreateDirectConversation(session.user.id, participantUserId)
    return NextResponse.json({ conversationId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la conversación'
    console.error('Chat create error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
