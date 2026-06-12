'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessageItem } from '@/lib/chat/service'
import { notifyChatUnreadChanged } from '@/hooks/use-chat-unread'

type WsEnvelope =
  | { type: 'auth_ok'; userId: string }
  | { type: 'joined'; conversationId: string }
  | { type: 'message'; message: ChatMessageItem }
  | { type: 'typing'; conversationId: string; userId: string; isTyping: boolean }
  | { type: 'read'; conversationId: string; userId: string }
  | { type: 'error'; message: string }

type UseChatSocketResult = {
  connected: boolean
  connecting: boolean
  messages: ChatMessageItem[]
  typingUserId: string | null
  sendMessage: (text: string) => Promise<void>
  notifyTyping: (isTyping: boolean) => void
  reloadHistory: () => Promise<void>
}

function createClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useChatSocket(conversationId: string): UseChatSocketResult {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const typingTimerRef = useRef<number | null>(null)
  const currentUserIdRef = useRef<string | null>(null)
  const connectRef = useRef<(() => Promise<void>) | null>(null)

  const reloadHistory = useCallback(async () => {
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`)
    if (!response.ok) throw new Error('No se pudo cargar el historial')
    const payload = (await response.json()) as { messages: ChatMessageItem[] }
    setMessages(payload.messages)
  }, [conversationId])

  const connect = useCallback(async () => {
    setConnecting(true)
    setConnected(false)

    try {
      await reloadHistory()

      const tokenResponse = await fetch('/api/chat/ws-token')
      if (!tokenResponse.ok) throw new Error('No se pudo autenticar el chat')
      const { token, url } = (await tokenResponse.json()) as { token: string; url: string }

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as WsEnvelope

        if (data.type === 'auth_ok') {
          currentUserIdRef.current = data.userId
          ws.send(JSON.stringify({ type: 'join', conversationId }))
          setConnected(true)
          setConnecting(false)
          return
        }

        if (data.type === 'message') {
          setMessages((prev) => {
            const normalized = {
              ...data.message,
              isMine: data.message.senderId === currentUserIdRef.current,
            }

            const withoutClientDuplicate = data.message.clientId
              ? prev.filter((item) => item.clientId !== data.message.clientId)
              : prev

            if (withoutClientDuplicate.some((item) => item.id === normalized.id)) {
              return withoutClientDuplicate
            }

            return [...withoutClientDuplicate, normalized]
          })
          if (data.message.senderId !== currentUserIdRef.current) {
            notifyChatUnreadChanged()
          }
          return
        }

        if (data.type === 'typing') {
          if (data.conversationId !== conversationId) return
          if (data.userId === currentUserIdRef.current) return
          setTypingUserId(data.isTyping ? data.userId : null)
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
          if (data.isTyping) {
            typingTimerRef.current = window.setTimeout(() => setTypingUserId(null), 2500)
          }
          return
        }

        if (data.type === 'error') {
          console.error('Chat WS error:', data.message)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setConnecting(false)
        reconnectTimerRef.current = window.setTimeout(() => {
          void connectRef.current?.()
        }, 2500)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch (error) {
      console.error('Chat connect error:', error)
      setConnecting(false)
      reconnectTimerRef.current = window.setTimeout(() => {
        void connectRef.current?.()
      }, 4000)
    }
  }, [conversationId, reloadHistory])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    queueMicrotask(() => {
      void connectRef.current?.()
    })

    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const clientId = createClientId()
      const optimistic: ChatMessageItem = {
        id: clientId,
        conversationId,
        senderId: currentUserIdRef.current || 'me',
        body: trimmed,
        clientId,
        createdAt: new Date().toISOString(),
        isMine: true,
      }

      setMessages((prev) => [...prev, optimistic])

      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'message',
            conversationId,
            body: trimmed,
            clientId,
          }),
        )
        return
      }

      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, clientId }),
      })

      if (!response.ok) {
        setMessages((prev) => prev.filter((item) => item.id !== clientId))
        throw new Error('No se pudo enviar el mensaje')
      }

      const payload = (await response.json()) as { message: ChatMessageItem }
      setMessages((prev) =>
        prev.map((item) => (item.id === clientId ? payload.message : item)),
      )
    },
    [conversationId],
  )

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify({ type: 'typing', conversationId, isTyping }))
    },
    [conversationId],
  )

  return {
    connected,
    connecting,
    messages,
    typingUserId,
    sendMessage,
    notifyTyping,
    reloadHistory,
  }
}
