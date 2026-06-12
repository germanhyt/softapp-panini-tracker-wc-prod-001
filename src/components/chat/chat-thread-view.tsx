'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChatTradeSuggestionPanel } from '@/components/chat/chat-trade-suggestion-panel'
import { useChatSocket } from '@/hooks/use-chat-socket'
import { MEETING_POINT } from '@/lib/brand'
import { notifyChatUnreadChanged } from '@/hooks/use-chat-unread'

type ChatThreadViewProps = {
  conversationId: string
  otherUserName: string
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatThreadView({ conversationId, otherUserName }: ChatThreadViewProps) {
  const { connected, connecting, messages, typingUserId, sendMessage, notifyTyping } =
    useChatSocket(conversationId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUserId])

  useEffect(() => {
    notifyChatUnreadChanged()
  }, [messages.length])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(draft)
      setDraft('')
      notifyTyping(false)
    } catch {
      alert('No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread-head card">
        <Link href="/chat" className="ghost-back" aria-label="Volver al inbox">
          ←
        </Link>
        <div>
          <h2 className="chat-thread-title">{otherUserName}</h2>
          <p className="muted-small">
            Chat interno privado · {connecting ? 'Conectando...' : connected ? 'En línea' : 'Reconectando...'}
          </p>
        </div>
      </div>

      <aside className="card chat-meeting-card">
        <p className="chat-meeting-kicker">Punto de encuentro oficial</p>
        <h3 className="chat-meeting-title">{MEETING_POINT.label}</h3>
        <p className="chat-meeting-policy">{MEETING_POINT.policyNote}</p>
      </aside>

      <ChatTradeSuggestionPanel
        conversationId={conversationId}
        otherUserName={otherUserName}
        onSuggest={(message) => setDraft(message)}
      />

      <div className="chat-thread-messages card">
        {messages.length === 0 ? (
          <p className="muted-small chat-thread-empty">Escribe el primer mensaje para coordinar el intercambio.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble-row ${message.isMine ? 'is-mine' : 'is-theirs'}`}
            >
              <div className={`chat-bubble ${message.isMine ? 'is-mine' : 'is-theirs'}`}>
                <p>{message.body}</p>
                <span>{formatMessageTime(message.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        {typingUserId && <p className="chat-typing-indicator">{otherUserName} está escribiendo...</p>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-composer card" onSubmit={(event) => void handleSubmit(event)}>
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            notifyTyping(event.target.value.trim().length > 0)
          }}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !draft.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
