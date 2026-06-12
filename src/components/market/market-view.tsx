'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MarketChatPreviewPanel } from '@/components/market/market-chat-preview-panel'
import { useMarketRealtime } from '@/hooks/use-market-realtime'
import { teamNames, teams } from '@/lib/domain/catalog'
import { APP_COUNTRY_CODE, COUNTRIES } from '@/lib/domain/countries'
import { BRAND_TITLE } from '@/lib/brand'
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
  country: APP_COUNTRY_CODE,
  team: '',
  q: '',
  page: 1,
}

const TYPE_TABS = [
  { value: 'all', label: 'Todas', hint: 'Repetidas y faltantes' },
  { value: 'offer', label: 'Repetidas', hint: 'Tiene de sobra' },
  { value: 'want', label: 'Faltantes', hint: 'Le falta pegar' },
] as const

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
  return type === 'offer' ? 'Repetida' : 'Falta'
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

  const loadMarket = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
    }
  }, [filters.page, queryString])

  const refreshMarket = useCallback(() => {
    void loadMarket(true)
  }, [loadMarket])

  const { live } = useMarketRealtime({ onRefresh: refreshMarket })

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

  const resultsLabel = loading
    ? 'Cargando publicaciones…'
    : pagination.total === 0
      ? 'Sin resultados'
      : `${pagination.total} figurita${pagination.total === 1 ? '' : 's'}`

  return (
    <div className="market-page">
      <header className="market-intro">
        <div className="market-intro-copy">
          <p className="market-hero-kicker">{BRAND_TITLE}</p>
          <h1 className="market-hero-title">Mercado de figuritas</h1>
          <p className="market-intro-desc">
            Lo que la comunidad tiene de sobra o aún le falta pegar. Filtra y encuentra tu próximo trueque.
          </p>
        </div>
        {live ? (
          <span className="market-live-badge">En vivo</span>
        ) : (
          <span className="market-live-badge market-live-badge-polling">Actualizando</span>
        )}
      </header>

      <section className="card market-toolbar" aria-label="Filtros del mercado">
        <div className="market-toolbar-top">
          <div className="market-type-tabs" role="tablist" aria-label="Tipo de publicación">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filters.type === tab.value}
                title={tab.hint}
                className={`market-type-tab ${filters.type === tab.value ? 'is-active' : ''}`}
                onClick={() => setFilters((prev) => ({ ...prev, type: tab.value, page: 1 }))}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-neutral-small market-clear-btn" onClick={resetFilters}>
            Limpiar filtros
          </button>
        </div>

        <div className="market-filters-grid">
          <label className="market-filter-field">
            <span>País del coleccionista</span>
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
              <option value="">Todos los países</option>
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
              <option value="">Todas las selecciones</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {teamNames[team] || team}
                </option>
              ))}
            </select>
          </label>

          <label className="market-filter-field market-filter-field-search">
            <span>Código</span>
            <div className="market-search-row">
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value.toUpperCase())}
                placeholder="PER1, ARG5, FWC1…"
                aria-label="Buscar por código de figurita"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters()
                }}
              />
              <button type="button" className="btn-primary market-search-btn" onClick={applyFilters}>
                Buscar
              </button>
            </div>
          </label>
        </div>

        <div className="market-results-bar">
          <p className="market-results-count">
            <strong>{resultsLabel}</strong>
            {!loading && pagination.totalPages > 1 ? (
              <span className="market-results-page">
                {' '}
                · Página {pagination.page} de {pagination.totalPages}
              </span>
            ) : null}
          </p>
          <p className="market-results-hint muted-small">
            {live
              ? 'La grilla se actualiza al instante cuando alguien publica.'
              : 'La grilla se refresca automáticamente cada pocos segundos.'}
            {isAuthenticated ? ' · Puedes ver el chat en cada tarjeta.' : ''}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="market-grid market-grid-loading" aria-busy="true" aria-label="Cargando mercado">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="market-card market-card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <section className="card empty-market-card">
          <p className="market-empty-kicker">Sin coincidencias</p>
          <h2>Nadie publicó con estos filtros</h2>
          <p>Prueba otro país, selección o código. También puedes publicar tus repetidas o faltantes desde tu perfil.</p>
          {isAuthenticated ? (
            <Link href="/profile" className="btn-primary">
              Ir a mi perfil
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
                <time className="market-card-date muted-small" dateTime={item.updatedAt}>
                  {formatRelativeDate(item.updatedAt)}
                </time>
              </div>

              <div className="market-sticker-code">{item.stickerCode}</div>

              <div className="market-card-meta"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  {item.listingType === 'offer' ? (
                    <p className="market-card-detail">
                      <span className="market-card-detail-label">Disponible</span>
                      <strong>{item.quantity}</strong>
                      <span className="market-card-detail-unit">{item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                    </p>
                  ) : (
                    <p className="market-card-detail market-card-detail-want">Busca completar su álbum</p>
                  )}
                </div>
                <div>
                  {item.teamCode ? (
                    <span className="market-team-chip">{teamNames[item.teamCode] || item.teamCode}</span>
                  ) : null}
                </div>
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
                <div className="market-user-info">
                  <div className="market-user-name">{item.user.displayName}</div>
                  {item.user.countryName ? <div className="muted-small">{item.user.countryName}</div> : null}
                </div>
              </div>

              {isAuthenticated && item.user.publisherUserId ? (
                <MarketChatPreviewPanel
                  publisherUserId={item.user.publisherUserId}
                  publisherName={item.user.displayName}
                />
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
          <span className="market-pagination-label">
            Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong>
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
