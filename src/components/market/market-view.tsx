'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MarketChatPreviewPanel } from '@/components/market/market-chat-preview-panel'
import { teamNames, teams } from '@/lib/domain/catalog'
import { COUNTRIES } from '@/lib/domain/countries'
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

  return (
    <div className="market-page">
      <section className="card market-hero-card">
        <p className="market-hero-kicker">Mercado comunitario</p>
        <h2 className="market-hero-title">Encuentra repetidas y faltantes publicadas</h2>
        <p className="muted-small">
          Filtra por país, selección o código para ver qué hay disponible para intercambiar.
          El chat es interno y privado; aquí solo puedes ver una vista previa cerrada si ya conversaste.
        </p>
      </section>

      <section className="card market-filters">
        <div className="market-filters-head">
          <div>
            <h2 className="market-section-title">Filtros</h2>
            <p className="muted-small">Busca figuritas repetidas o faltantes publicadas por otros coleccionistas.</p>
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
        <p className="muted-small">
          {loading
            ? 'Cargando publicaciones...'
            : `${pagination.total} publicación${pagination.total === 1 ? '' : 'es'} encontrada${pagination.total === 1 ? '' : 's'}`}
        </p>
        {!isAuthenticated && (
          <p className="muted-small">
            <Link href="/login" className="market-inline-link">
              Inicia sesión
            </Link>{' '}
            para usar el chat interno con otros coleccionistas.
          </p>
        )}
      </section>

      {loading ? (
        <div className="loading market-loading">Cargando mercado...</div>
      ) : items.length === 0 ? (
        <section className="card empty-market-card">
          <h3>Sin publicaciones por ahora</h3>
          <p>No hay figuritas que coincidan con estos filtros. Prueba ampliar la búsqueda o vuelve más tarde.</p>
          {isAuthenticated ? (
            <Link href="/profile" className="btn-primary">
              Publicar desde mi perfil
            </Link>
          ) : (
            <Link href="/register" className="btn-primary">
              Crear cuenta y publicar
            </Link>
          )}
        </section>
      ) : (
        <div className="market-grid">
          {items.map((item) => (
            <article key={item.id} className={`market-card market-card-${item.listingType}`}>
              <div className="market-card-top">
                <span className={`market-badge market-badge-${item.listingType}`}>{listingLabel(item.listingType)}</span>
                <span className="muted-small">{formatRelativeDate(item.updatedAt)}</span>
              </div>

              <div className="market-sticker-code">{item.stickerCode}</div>

              <div className="market-card-meta">
                {item.listingType === 'offer' ? (
                  <p>
                    Cantidad: <strong>{item.quantity}</strong>
                  </p>
                ) : (
                  <p>Necesita esta figurita</p>
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

              {isAuthenticated && item.user.publisherUserId ? (
                <MarketChatPreviewPanel
                  publisherUserId={item.user.publisherUserId}
                  publisherName={item.user.displayName}
                />
              ) : !isAuthenticated ? (
                <Link href="/login" className="btn-secondary market-contact-link">
                  Inicia sesión para chat interno
                </Link>
              ) : null}
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
