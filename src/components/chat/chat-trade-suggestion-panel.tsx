'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import {
  buildTradeSuggestionMessage,
  type ChatTradeSuggestion,
} from '@/lib/chat/trade-suggestion'

type ChatTradeSuggestionPanelProps = {
  conversationId: string
  otherUserName: string
  onSuggest: (message: string) => void
}

function formatItems(items: ChatTradeSuggestion['iOfferTheyWant']): string {
  if (items.length === 0) return 'Sin coincidencias publicadas'
  return items
    .map((item) => (item.quantity > 1 ? `${item.code} (x${item.quantity})` : item.code))
    .join(', ')
}

export function ChatTradeSuggestionPanel({
  conversationId,
  otherUserName,
  onSuggest,
}: ChatTradeSuggestionPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<ChatTradeSuggestion | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSuggestion = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/trade-suggestion`)
      if (!response.ok) throw new Error('Failed to load suggestion')
      const payload = (await response.json()) as {
        otherUserName: string
        suggestion: ChatTradeSuggestion
      }
      setSuggestion(payload.suggestion)
      setLoaded(true)
    } catch (loadError) {
      console.error('Trade suggestion error:', loadError)
      setError('No se pudo cargar la sugerencia de trueque.')
    } finally {
      setLoading(false)
    }
  }, [conversationId, loaded])

  useOnMount(() => {
    void loadSuggestion()
  })

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      void loadSuggestion()
    }
  }

  const handleSuggest = () => {
    if (!suggestion) return
    onSuggest(
      buildTradeSuggestionMessage({
        otherUserName,
        suggestion,
      }),
    )
  }

  const canSuggest =
    suggestion &&
    suggestion.exchangeCount > 0 &&
    suggestion.iOfferTheyWant.length > 0 &&
    suggestion.theyOfferIWant.length > 0

  return (
    <section className="card chat-trade-panel">
      <button type="button" className="chat-trade-panel-toggle" onClick={handleToggle}>
        {open ? 'Ocultar sugerencia de trueque' : '🤝 Sugerir trueque con lo publicado'}
      </button>

      {open && (
        <div className="chat-trade-panel-body">
          {loading ? (
            <p className="muted-small">Calculando coincidencias del mercado...</p>
          ) : error ? (
            <p className="muted-small">{error}</p>
          ) : suggestion ? (
            <>
              <p className="muted-small">
                Cruce según las publicaciones activas de repetidas y faltantes en el mercado.
              </p>

              <div className="chat-trade-grid">
                <div>
                  <strong>🎯 Tú ofreces</strong>
                  <p>{formatItems(suggestion.iOfferTheyWant)}</p>
                </div>
                <div>
                  <strong>🎁 {otherUserName} ofrece</strong>
                  <p>{formatItems(suggestion.theyOfferIWant)}</p>
                </div>
              </div>

              {suggestion.exchangeCount > 0 && (
                <p className="chat-trade-count">
                  {suggestion.exchangeCount} intercambio{suggestion.exchangeCount === 1 ? '' : 's'} posible
                  {suggestion.exchangeCount === 1 ? '' : 's'} según lo publicado.
                </p>
              )}

              {!suggestion.hasMyPublications && (
                <p className="chat-trade-hint">
                  Aún no publicas en el mercado.{' '}
                  <Link href="/profile">Activa repetidas o faltantes en tu perfil</Link>.
                </p>
              )}

              {!suggestion.hasTheirPublications && (
                <p className="chat-trade-hint">
                  {otherUserName} aún no tiene publicaciones activas en el mercado.
                </p>
              )}

              {canSuggest ? (
                <button type="button" className="btn-primary" onClick={handleSuggest}>
                  Insertar propuesta en el mensaje
                </button>
              ) : (
                <p className="muted-small">
                  No hay coincidencias publicadas entre ambos por ahora. Actualiza tu álbum y mercado, o acuerda
                  manualmente.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
