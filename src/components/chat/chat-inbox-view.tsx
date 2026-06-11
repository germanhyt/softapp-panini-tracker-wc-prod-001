'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import type { ChatConversationPreview } from '@/lib/chat/service'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatInboxView() {
  const [conversations, setConversations] = useState<ChatConversationPreview[]>([])
  const [loading, setLoading] = useState(true)

  const loadInbox = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat/conversations')
      if (!response.ok) throw new Error('Failed to load inbox')
      const payload = (await response.json()) as { conversations: ChatConversationPreview[] }
      setConversations(payload.conversations)
    } catch (error) {
      console.error('Inbox error:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useOnMount(() => loadInbox())

  if (loading) {
    return <div className="loading">Cargando conversaciones...</div>
  }

  if (conversations.length === 0) {
    return (
      <section className="card chat-empty-card">
        <h3>Sin conversaciones aún</h3>
        <p className="muted-small">
          Ve a Matches y pulsa &quot;Enviar mensaje&quot; para coordinar un intercambio en tiempo real.
        </p>
        <Link href="/matches" className="btn-primary">
          Ir a Matches
        </Link>
      </section>
    )
  }

  return (
    <div className="chat-inbox-list">
      {conversations.map((conversation) => (
        <Link key={conversation.id} href={`/chat/${conversation.id}`} className="chat-inbox-item">
          <div className="chat-inbox-avatar">
            {conversation.otherUser.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={conversation.otherUser.photoUrl} alt={conversation.otherUser.displayName} />
            ) : (
              conversation.otherUser.displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="chat-inbox-body">
            <div className="chat-inbox-head">
              <strong>{conversation.otherUser.displayName}</strong>
              <span className="muted-small">
                {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
              </span>
            </div>
            <p className="chat-inbox-preview">
              {conversation.lastMessage
                ? `${conversation.lastMessage.isMine ? 'Tú: ' : ''}${conversation.lastMessage.body}`
                : 'Conversación nueva'}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <span className="chat-unread-badge">{conversation.unreadCount}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
