import { WebSocketServer, WebSocket } from 'ws'
import { prisma } from '../src/lib/db/prisma'
import {
  markConversationRead,
  sendChatMessage,
  userCanAccessConversation,
} from '../src/lib/chat/service'
import { verifyChatWsToken } from '../src/lib/chat/ws-token'

type ClientSocket = WebSocket & { userId?: string; isAlive?: boolean }

type IncomingMessage =
  | { type: 'auth'; token: string }
  | { type: 'join'; conversationId: string }
  | { type: 'leave'; conversationId: string }
  | { type: 'message'; conversationId: string; body: string; clientId?: string }
  | { type: 'typing'; conversationId: string; isTyping?: boolean }
  | { type: 'read'; conversationId: string }

type SocketMeta = {
  userId: string
  conversationIds: Set<string>
}

const port = Number(process.env.WS_PORT || 3002)
const sockets = new Map<ClientSocket, SocketMeta>()
const rooms = new Map<string, Set<ClientSocket>>()

function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function addToRoom(conversationId: string, socket: ClientSocket) {
  if (!rooms.has(conversationId)) {
    rooms.set(conversationId, new Set())
  }
  rooms.get(conversationId)!.add(socket)
}

function removeFromRoom(conversationId: string, socket: ClientSocket) {
  rooms.get(conversationId)?.delete(socket)
  if (rooms.get(conversationId)?.size === 0) {
    rooms.delete(conversationId)
  }
}

function broadcastToRoom(
  conversationId: string,
  payload: unknown,
  exclude?: ClientSocket,
) {
  const room = rooms.get(conversationId)
  if (!room) return

  room.forEach((socket) => {
    if (socket !== exclude) {
      sendJson(socket, payload)
    }
  })
}

const wss = new WebSocketServer({ port })

wss.on('connection', (socket: ClientSocket) => {
  socket.isAlive = true

  socket.on('pong', () => {
    socket.isAlive = true
  })

  socket.on('message', async (raw) => {
    let data: IncomingMessage
    try {
      data = JSON.parse(raw.toString()) as IncomingMessage
    } catch {
      sendJson(socket, { type: 'error', message: 'Mensaje inválido' })
      return
    }

    if (data.type === 'auth') {
      try {
        const userId = await verifyChatWsToken(data.token)
        socket.userId = userId
        sockets.set(socket, { userId, conversationIds: new Set() })
        sendJson(socket, { type: 'auth_ok', userId })
      } catch {
        sendJson(socket, { type: 'error', message: 'Token inválido o expirado' })
        socket.close()
      }
      return
    }

    const meta = sockets.get(socket)
    if (!meta?.userId) {
      sendJson(socket, { type: 'error', message: 'Debes autenticarte primero' })
      return
    }

    if (data.type === 'join') {
      const allowed = await userCanAccessConversation(meta.userId, data.conversationId)
      if (!allowed) {
        sendJson(socket, { type: 'error', message: 'Conversación no permitida' })
        return
      }

      meta.conversationIds.add(data.conversationId)
      addToRoom(data.conversationId, socket)
      await markConversationRead(meta.userId, data.conversationId)
      sendJson(socket, { type: 'joined', conversationId: data.conversationId })
      return
    }

    if (data.type === 'leave') {
      meta.conversationIds.delete(data.conversationId)
      removeFromRoom(data.conversationId, socket)
      sendJson(socket, { type: 'left', conversationId: data.conversationId })
      return
    }

    if (data.type === 'read') {
      const allowed = await userCanAccessConversation(meta.userId, data.conversationId)
      if (!allowed) return
      await markConversationRead(meta.userId, data.conversationId)
      broadcastToRoom(data.conversationId, {
        type: 'read',
        conversationId: data.conversationId,
        userId: meta.userId,
      }, socket)
      return
    }

    if (data.type === 'typing') {
      const allowed = await userCanAccessConversation(meta.userId, data.conversationId)
      if (!allowed) return
      broadcastToRoom(
        data.conversationId,
        {
          type: 'typing',
          conversationId: data.conversationId,
          userId: meta.userId,
          isTyping: data.isTyping !== false,
        },
        socket,
      )
      return
    }

    if (data.type === 'message') {
      try {
        const saved = await sendChatMessage({
          userId: meta.userId,
          conversationId: data.conversationId,
          body: data.body,
          clientId: data.clientId,
        })

        const payload = {
          type: 'message',
          message: saved,
        }

        sendJson(socket, payload)
        broadcastToRoom(data.conversationId, payload, socket)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje'
        sendJson(socket, { type: 'error', message })
      }
    }
  })

  socket.on('close', () => {
    const meta = sockets.get(socket)
    if (meta) {
      meta.conversationIds.forEach((conversationId) => removeFromRoom(conversationId, socket))
    }
    sockets.delete(socket)
  })
})

const heartbeat = setInterval(() => {
  wss.clients.forEach((socket) => {
    const client = socket as ClientSocket
    if (client.isAlive === false) {
      client.terminate()
      return
    }
    client.isAlive = false
    client.ping()
  })
}, 30000)

wss.on('close', () => {
  clearInterval(heartbeat)
  void prisma.$disconnect()
})

console.log(`Chat WebSocket escuchando en ws://localhost:${port}`)
