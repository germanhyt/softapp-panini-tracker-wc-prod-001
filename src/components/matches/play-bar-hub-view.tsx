'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import { StartChatButton } from '@/components/chat/start-chat-button'
import { MEETING_POINT } from '@/lib/brand'
import type { MatchesResponse } from '@/lib/matches/service'

type PlayBarHubViewProps = {
  countryCode: string | null
  companyUserId: string | null
  isAdmin?: boolean
}

export function PlayBarHubView({ countryCode, companyUserId, isAdmin = false }: PlayBarHubViewProps) {
  const [data, setData] = useState<MatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to load summary')
      const payload = (await response.json()) as MatchesResponse
      setData(payload)
    } catch (error) {
      console.error('Error loading trade summary:', error)
      setData({
        countryCode,
        countryRequired: !countryCode,
        mySummary: { duplicates: 0, missing: 0 },
        matches: [],
      })
    } finally {
      setLoading(false)
    }
  }, [countryCode])

  useOnMount(() => loadSummary())

  if (loading) {
    return <div className="loading">Preparando tu espacio de canje...</div>
  }

  const countryRequired = data?.countryRequired ?? !countryCode

  if (countryRequired) {
    return (
      <div className="matches-page">
        <div className="matches-head">
          <div>
            <h2>🤝 Canje en Play Bar</h2>
            <p>Completa tu perfil para usar el mercado y el chat con {MEETING_POINT.venue}.</p>
          </div>
        </div>

        <div className="card empty-matches-card country-required-card">
          <p className="empty-icon">📍</p>
          <h3>Selecciona tu país para continuar</h3>
          <p>Necesitamos tu país en el perfil para personalizar tu experiencia en el catálogo.</p>
          <Link href="/profile" className="btn-primary">
            Completar país en mi perfil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="matches-page">
      <div className="matches-head">
        <div>
          <h2>🤝 Canje en {MEETING_POINT.name}</h2>
          <p>{MEETING_POINT.policyNote}</p>
        </div>
      </div>

      <section className="card market-playbar-cta playbar-hero-card">
        <p className="market-hero-kicker">Punto de encuentro oficial</p>
        <h3 className="market-hero-title">Acércate a {MEETING_POINT.label} para canjear</h3>
        <p className="muted-small">
          Primero revisa el catálogo y luego escríbenos para confirmar disponibilidad.
        </p>
        <div className="playbar-hero-actions">
          <Link href="/mercado" className="btn-primary">
            Ver catálogo
          </Link>
          {!isAdmin && companyUserId && (
            <StartChatButton participantUserId={companyUserId} label="Escribir a la empresa" className="btn-secondary" />
          )}
        </div>
      </section>

      <div className="card playbar-steps-card">
        <h3 className="text-lg font-semibold">3 pasos rápidos</h3>
        <ol className="playbar-steps-list">
          <li>Revisa el catálogo publicado por {MEETING_POINT.venue}.</li>
          <li>Escríbenos por chat para confirmar disponibilidad.</li>
          <li>Acércate a {MEETING_POINT.label} y realiza el canje presencial.</li>
        </ol>
      </div>

      {isAdmin && (
        <div className="card space-y-2">
          <h3 className="text-lg font-semibold">Cuenta empresa</h3>
          <p className="muted-small">
            Publica el catálogo desde tu perfil y responde los chats de coleccionistas desde la bandeja de mensajes.
          </p>
          <Link href="/profile" className="btn-secondary">
            Ir a publicación del mercado
          </Link>
        </div>
      )}
    </div>
  )
}
