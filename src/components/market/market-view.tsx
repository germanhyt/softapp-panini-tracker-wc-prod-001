'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MarketChatPreviewPanel } from '@/components/market/market-chat-preview-panel'
import { MarketPlayBarIntroModal } from '@/components/market/market-playbar-intro-modal'
import { teamNames, teams } from '@/lib/domain/catalog'
import { COUNTRIES } from '@/lib/domain/countries'
import { MEETING_POINT } from '@/lib/brand'
import type { ListingType, MarketSearchResponse } from '@/lib/market/service'

type MarketFilters = {
  type: ListingType | 'all'
  country: string
  team: string
  q: string
  page: number
}

const DEFAULT_FILTERS: MarketFilters = {
  type: 'all',
  country: '',
  team: '',
  q: '',
  page: 1,
}

function initials(name: string): string {
  return name.slice(0, 1).toUpperCase() || 'C'
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function listingLabel(type: ListingType): string {
  return type === 'offer' ? 'Ofrece' : 'Busca'
}

type MarketViewProps = {
  isAuthenticated?: boolean
}

export function MarketView({ isAuthenticated = false }: MarketViewProps) {
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS)
  const [draftQuery, setDraftQuery] = useState('')
  const [data, setData] = useState<MarketSearchResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(filters.page))
    params.set('limit', '24')
    if (filters.type !== 'all') params.set('type', filters.type)
    if (filters.country) params.set('country', filters.country)
    if (filters.team) params.set('team', filters.team)
    if (filters.q) params.set('q', filters.q)
    return params.toString()
  }, [filters])

  const loadMarket = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/market?${queryString}`)
      if (!response.ok) throw new Error('Failed to load market')
      const payload = (await response.json()) as MarketSearchResponse
      setData(payload)
    } catch (error) {
      console.error('Error loading market:', error)
      setData({
        items: [],
        pagination: { page: filters.page, limit: 24, total: 0, totalPages: 0 },
      })
    } finally {
      setLoading(false)
    }
  }, [filters.page, queryString])

  useEffect(() => {
    queueMicrotask(() => {
      void loadMarket()
    })
  }, [loadMarket])

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      q: draftQuery.trim().toUpperCase(),
      page: 1,
    }))
  }

  const resetFilters = () => {
    setDraftQuery('')
    setFilters(DEFAULT_FILTERS)
  }

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 24, total: 0, totalPages: 0 }
  const hasFullAccess = isAuthenticated

  return (
    <div className="market-page">
      {!hasFullAccess && <MarketPlayBarIntroModal />}

      <section className="card market-hero-card">
        <p className="market-hero-kicker">Catálogo oficial</p>
        <h2 className="market-hero-title">Figuritas disponibles para intercambio</h2>
        <p className="muted-small">
          Publicado por {MEETING_POINT.venue}.{' '}
          {!hasFullAccess
            ? 'Las figuritas se muestran en vista previa. Inicia sesión para desbloquear el detalle y escribirnos.'
            : 'Puedes escribirnos desde cada publicación para coordinar tu visita a Play Bar.'}
        </p>
      </section>

      <section className="card market-filters">
        <div className="market-filters-head">
          <div>
            <h2 className="market-section-title">Filtros</h2>
            <p className="muted-small">Busca repetidas o faltantes publicadas por {MEETING_POINT.venue}.</p>
          </div>
          <button type="button" className="btn-neutral-small" onClick={resetFilters}>
            Limpiar
          </button>
        </div>

        <div className="market-type-tabs" role="tablist" aria-label="Tipo de publicación">
          {([
            { value: 'all', label: 'Todos' },
            { value: 'offer', label: 'Repetidas' },
            { value: 'want', label: 'Faltantes' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filters.type === tab.value}
              className={`market-type-tab ${filters.type === tab.value ? 'is-active' : ''}`}
              onClick={() => setFilters((prev) => ({ ...prev, type: tab.value, page: 1 }))}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="market-filters-grid">
          <label className="market-filter-field">
            <span>País</span>
            <select
              value={filters.country}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  country: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">Todos</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label className="market-filter-field">
            <span>Selección</span>
            <select
              value={filters.team}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  team: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">Todas</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {teamNames[team] || team}
                </option>
              ))}
            </select>
          </label>

          <label className="market-filter-field market-filter-field-wide">
            <span>Código de figurita</span>
            <div className="market-search-row">
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value.toUpperCase())}
                placeholder="Ej. PER1, ARG5, FWC1"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters()
                }}
              />
              <button type="button" className="btn-primary" onClick={applyFilters}>
                Buscar
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="market-results-head">
        <p className="market-results-summary">
          {loading
            ? 'Cargando publicaciones...'
            : `${pagination.total} publicación${pagination.total === 1 ? '' : 'es'} encontrada${pagination.total === 1 ? '' : 's'}`}
        </p>
        {!hasFullAccess && (
          <p className="market-results-cta">
            <Link href="/login" className="market-inline-link">
              Inicia sesión
            </Link>{' '}
            o{' '}
            <Link href="/register" className="market-inline-link">
              regístrate
            </Link>{' '}
            para quitar el difuminado y chatear con {MEETING_POINT.venue}.
          </p>
        )}
      </section>

      {loading ? (
        <div className="loading market-loading">Cargando mercado...</div>
      ) : items.length === 0 ? (
        <section className="card empty-market-card">
          <h3>Sin publicaciones por ahora</h3>
          <p>No hay figuritas que coincidan con estos filtros. Prueba ampliar la búsqueda o vuelve más tarde.</p>
          {!hasFullAccess && (
            <Link href="/register" className="btn-primary">
              Crear cuenta para ver el catálogo completo
            </Link>
          )}
        </section>
      ) : (
        <div className="market-grid">
          {items.map((item) => (
            <article
              key={item.id}
              className={`market-card market-card-${item.listingType} ${hasFullAccess ? '' : 'market-card-locked'}`}
            >
              <div className="market-card-body">
                <div className="market-card-top">
                  <span className={`market-badge market-badge-${item.listingType}`}>{listingLabel(item.listingType)}</span>
                  <span className="muted-small">{formatRelativeDate(item.updatedAt)}</span>
                </div>

                <div className="market-sticker-code">{item.stickerCode}</div>

                <div className="market-card-meta">
                  {item.listingType === 'offer' ? (
                    <p className="market-card-qty">
                      Cantidad disponible: <strong>{item.quantity}</strong>
                    </p>
                  ) : (
                    <p className="market-card-need">Buscamos esta figurita</p>
                  )}
                  {item.teamCode && <p className="muted-small">{teamNames[item.teamCode] || item.teamCode}</p>}
                </div>

                <div className="market-user-row">
                  <div className="match-avatar">
                    {item.user.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.user.photoUrl} alt={item.user.displayName} />
                    ) : (
                      initials(item.user.displayName)
                    )}
                  </div>
                  <div>
                    <div className="market-user-name">{item.user.displayName}</div>
                    {item.user.countryName && <div className="muted-small">{item.user.countryName}</div>}
                  </div>
                </div>

                {hasFullAccess && item.user.publisherUserId ? (
                  <MarketChatPreviewPanel
                    publisherUserId={item.user.publisherUserId}
                    publisherName={item.user.displayName}
                  />
                ) : null}
              </div>

              {!hasFullAccess && (
                <div className="market-card-lock-overlay">
                  <span className="market-card-lock-icon" aria-hidden="true">
                    🔒
                  </span>
                  <p>Inicia sesión para ver el detalle y escribir a la empresa</p>
                  <Link href="/login" className="btn-primary">
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <nav className="market-pagination" aria-label="Paginación del mercado">
          <button
            type="button"
            className="btn-neutral-small"
            disabled={pagination.page <= 1 || loading}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Anterior
          </button>
          <span className="muted-small">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn-neutral-small"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  )
}
