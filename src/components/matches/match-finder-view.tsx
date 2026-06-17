'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import { openMailtoUrl } from '@/lib/open-mailto'
import { buildMatchEmailBody, compactStickerList } from '@/lib/domain/match-engine'
import { StartChatButton } from '@/components/chat/start-chat-button'
import { getCountryName } from '@/lib/domain/countries'
import type { MatchResult, MatchesResponse } from '@/lib/matches/service'

type MatchFinderViewProps = {
  countryCode: string | null
  myDisplayName: string
}

function initials(user: { name: string; surname: string; email: string }): string {
  const label = `${user.name || ''} ${user.surname || ''}`.trim() || user.email || 'U'
  return label.slice(0, 1).toUpperCase()
}

function buildMailtoUrl(input: { to: string; subject: string; body: string }): string {
  return `mailto:${encodeURIComponent(input.to)}?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.body)}`
}

export function MatchFinderView({ countryCode, myDisplayName }: MatchFinderViewProps) {
  const [data, setData] = useState<MatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const loadMatches = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Failed to load matches')
      const payload = (await response.json()) as MatchesResponse
      setData(payload)
    } catch (error) {
      console.error('Error loading matches:', error)
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

  useOnMount(() => loadMatches())

  const generateEmailBody = (match: MatchResult) => {
    const theirName = `${match.user.name || ''} ${match.user.surname || ''}`.trim() || 'amigo'
    return buildMatchEmailBody({
      theirName,
      myName: myDisplayName || 'un coleccionista',
      myOffer: match.myOffer,
      myRequest: match.myRequest,
    })
  }

  const openEmailInvite = (match: MatchResult) => {
    if (!match.user.email) return
    const subject = 'Invitación para intercambiar figuritas Panini 2026'
    const body = generateEmailBody(match)
    openMailtoUrl(buildMailtoUrl({ to: match.user.email, subject, body }))
  }

  if (loading) {
    return <div className="loading">🔍 Buscando mejores matches...</div>
  }

  const countryRequired = data?.countryRequired ?? !countryCode
  const matches = data?.matches ?? []
  const mySummary = data?.mySummary ?? { duplicates: 0, missing: 0 }
  const activeCountry = data?.countryCode || countryCode

  if (countryRequired) {
    return (
      <div className="matches-page">
        <div className="matches-head">
          <div>
            <h2>🤝 Mejores matches</h2>
            <p>Para mostrarte intercambios relevantes necesitamos conocer tu país.</p>
          </div>
        </div>

        <div className="card empty-matches-card country-required-card">
          <p className="empty-icon">📍</p>
          <h3>Selecciona tu país para habilitar matches</h3>
          <p>Así evitamos mostrarte usuarios muy lejos de tu ubicación y priorizamos intercambios posibles.</p>
          <Link href="/profile" className="btn-primary">
            Completar país en mi perfil
          </Link>
        </div>
      </div>
    )
  }

  const visibleMatches = showAll ? matches : matches.slice(0, 10)

  return (
    <div className="matches-page">
      <div className="matches-head">
        <div>
          <h2>🤝 Mejores matches</h2>
          <p>
            Ordenados por mayor cantidad de figuras intercambiables reales en{' '}
            {getCountryName(activeCountry || '') || 'tu país'}.
          </p>
        </div>
        <button type="button" onClick={() => void loadMatches()} className="btn-refresh-matches">
          🔄 Actualizar
        </button>
      </div>

      <div className="card match-my-summary">
        <p>
          🔁 <strong>Tus repetidas:</strong> {mySummary.duplicates}
        </p>
        <p>
          ❌ <strong>Te faltan:</strong> {mySummary.missing}
        </p>
        <small>
          El ranking prioriza usuarios que tienen repetidas que te faltan y a quienes tú puedes darles repetidas que
          ellos no tienen.
        </small>
      </div>

      {matches.length === 0 ? (
        <div className="card empty-matches-card">
          <p className="empty-icon">😔</p>
          <h3>Aún no hay matches útiles</h3>
          <p>
            Marca tus repetidas y espera que otros usuarios de {getCountryName(activeCountry || '') || 'tu país'} también
            completen su álbum.
          </p>
        </div>
      ) : (
        <>
          <p className="match-count-line">
            ✅ {matches.length} match(es) encontrados. Mostrando {visibleMatches.length}
            {!showAll && matches.length > 10 ? ' mejores' : ''}.
          </p>

          <div className="match-list">
            {visibleMatches.map((match, index) => {
              const selected = selectedMatchId === match.user.id
              const hasEmail = Boolean(match.user.email)

              return (
                <div key={match.user.id} className="match-card enhanced-match-card">
                  <div className="match-card-head">
                    <div className="match-rank">#{index + 1}</div>
                    <div className="match-avatar">
                      {match.user.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={match.user.photoUrl} alt="Foto de perfil" />
                      ) : (
                        <span>{initials(match.user)}</span>
                      )}
                    </div>
                    <div className="match-user-main">
                      <div className="user-name">
                        {match.user.name} {match.user.surname}
                      </div>
                      <div className="match-score-pill">
                        {match.exchangeCount} intercambio{match.exchangeCount === 1 ? '' : 's'} posibles
                      </div>
                    </div>
                  </div>

                  <div className="match-detail match-detail-grid">
                    <div>
                      <strong>🎁 Te puede dar</strong>
                      <p>{compactStickerList(match.myRequest)}</p>
                    </div>
                    <div>
                      <strong>🎯 Tú le das</strong>
                      <p>{compactStickerList(match.myOffer)}</p>
                    </div>
                  </div>

                  <div className="match-actions">
                    <StartChatButton participantUserId={match.user.id} label="Chat interno" />
                    <button
                      type="button"
                      className="btn-email-invite"
                      onClick={() => openEmailInvite(match)}
                      disabled={!hasEmail}
                      title={
                        hasEmail ? 'Abrir correo con invitación automática' : 'Este usuario no tiene correo disponible'
                      }
                    >
                      📩 Enviar invitación
                    </button>
                    <button
                      type="button"
                      className="btn-neutral-small"
                      onClick={() => setSelectedMatchId(selected ? null : match.user.id)}
                    >
                      {selected ? 'Ocultar mensaje' : 'Ver mensaje'}
                    </button>
                  </div>

                  {selected && (
                    <div className="message-preview-box">
                      <p>📝 Mensaje pre-armado:</p>
                      <div style={{ whiteSpace: 'pre-line' }}>{generateEmailBody(match)}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {matches.length > 10 && (
            <button type="button" className="btn-secondary" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Ver solo Top 10' : `Ver todos los matches (${matches.length})`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
