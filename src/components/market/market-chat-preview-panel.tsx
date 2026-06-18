'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { StartChatButton } from '@/components/chat/start-chat-button'
import type { MarketChatPreview } from '@/lib/chat/service'

type MarketChatPreviewPanelProps = {
  publisherUserId: string
  publisherName: string
  prefillMessage?: string
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MarketChatPreviewPanel({
  publisherUserId,
  publisherName,
  prefillMessage,
}: MarketChatPreviewPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<MarketChatPreview | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadPreview = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const response = await fetch(`/api/chat/preview/${publisherUserId}`)
      if (!response.ok) throw new Error('Failed to load preview')
      const payload = (await response.json()) as MarketChatPreview
      setPreview(payload)
      setLoaded(true)
    } catch (error) {
      console.error('Preview error:', error)
      setPreview({ conversationId: null, messages: [], isClosed: true })
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [loaded, publisherUserId])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      void loadPreview()
    }
  }

  const chatLink = preview?.conversationId
    ? prefillMessage?.trim()
      ? `/chat/${preview.conversationId}?${new URLSearchParams({ prefill: prefillMessage.trim() }).toString()}`
      : `/chat/${preview.conversationId}`
    : null

  return (
    <div className="market-chat-preview">
      <button type="button" className="market-chat-preview-toggle" onClick={handleToggle}>
        {open ? 'Ocultar conversación' : 'Ver últimos mensajes (solo lectura)'}
      </button>

      {open && (
        <div className="market-chat-preview-panel">
          <div className="market-chat-preview-head">
            <span className="market-chat-closed-badge">Conversación cerrada</span>
            <p className="muted-small">Vista previa con {publisherName}. Para responder, abre el chat interno.</p>
          </div>

          {loading ? (
            <p className="muted-small">Cargando mensajes...</p>
          ) : preview?.messages.length ? (
            <div className="market-chat-preview-messages">
              {preview.messages.map((message) => (
                <div
                  key={message.id}
                  className={`market-chat-preview-line ${message.isMine ? 'is-mine' : 'is-theirs'}`}
                >
                  <strong>{message.isMine ? 'Tú' : publisherName}:</strong>
                  <span>{message.body}</span>
                  <time>{formatMessageTime(message.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-small">Aún no hay mensajes con este coleccionista.</p>
          )}

          <div className="market-chat-preview-actions">
            {chatLink ? (
              <Link href={chatLink} className="btn-primary">
                Continuar en chat interno
              </Link>
            ) : (
              <StartChatButton
                participantUserId={publisherUserId}
                label="Escribir a la empresa"
                prefillMessage={prefillMessage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
