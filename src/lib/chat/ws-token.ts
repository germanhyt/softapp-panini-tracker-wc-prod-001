import { SignJWT, jwtVerify } from 'jose'

const WS_TOKEN_SCOPE = 'chat-ws'
const WS_TOKEN_TTL = '2m'

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET no configurado')
  }
  return new TextEncoder().encode(secret)
}

export async function createChatWsToken(userId: string): Promise<string> {
  return new SignJWT({ scope: WS_TOKEN_SCOPE })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(WS_TOKEN_TTL)
    .sign(getAuthSecret())
}

export async function verifyChatWsToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getAuthSecret())
  if (payload.scope !== WS_TOKEN_SCOPE || typeof payload.sub !== 'string') {
    throw new Error('Token WebSocket inválido')
  }
  return payload.sub
}

export function getPublicWsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002'
}
