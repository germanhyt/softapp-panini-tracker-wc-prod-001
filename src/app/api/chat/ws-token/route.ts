import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createChatWsToken, getPublicWsUrl } from '@/lib/chat/ws-token'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const token = await createChatWsToken(session.user.id)
    return NextResponse.json({
      token,
      url: getPublicWsUrl(),
    })
  } catch (error) {
    console.error('Chat ws-token error:', error)
    return NextResponse.json({ error: 'No se pudo generar el token de chat' }, { status: 500 })
  }
}
