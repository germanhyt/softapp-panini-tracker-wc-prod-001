'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type StartChatButtonProps = {
  participantUserId: string
  label?: string
  className?: string
}

export function StartChatButton({
  participantUserId,
  label = 'Enviar mensaje',
  className = 'btn-neutral-small',
}: StartChatButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantUserId }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'No se pudo abrir el chat')
      }

      const payload = (await response.json()) as { conversationId: string }
      router.push(`/chat/${payload.conversationId}`)
    } catch (error) {
      console.error('Start chat error:', error)
      const message = error instanceof Error ? error.message : 'No se pudo abrir el chat. Intenta nuevamente.'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" className={className} disabled={loading} onClick={() => void handleClick()}>
      {loading ? 'Abriendo...' : `💬 ${label}`}
    </button>
  )
}
