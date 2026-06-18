'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import { StartChatButton } from '@/components/chat/start-chat-button'
import { useMarketRealtime } from '@/hooks/use-market-realtime'
import { MarketPlayBarIntroModal } from '@/components/market/market-playbar-intro-modal'
import { teamNames, teams } from '@/lib/domain/catalog'
import { APP_COUNTRY_CODE, COUNTRIES } from '@/lib/domain/countries'
import { MEETING_POINT } from '@/lib/brand'
import type { ListingType, MarketSearchResponse } from '@/lib/market/service'

type MarketFilters = {
  type: ListingType | 'all'
  country: string
  team: string
  order: 'asc' | 'desc'
  q: string
  page: number
}

const DEFAULT_FILTERS: MarketFilters = {
  type: 'all',
  country: APP_COUNTRY_CODE,
  team: '',
  order: 'asc',
  q: '',
  page: 1,
}

type TeamOption = {
  value: string
  label: string
}

type CountryOption = {
  value: string
  label: string
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

function buildPrefillMessage(stickerCodes: string[]): string {
  if (!stickerCodes.length) return ''
  return `Hola, me interesan estas figuritas: ${stickerCodes.join(', ')}. ¿Siguen disponibles para canje en Play Bar?`
}

type MarketViewProps = {
  isAuthenticated?: boolean
}

export function MarketView({ isAuthenticated = false }: MarketViewProps) {
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS)
  const [draftQuery, setDraftQuery] = useState('')
  const [selectedStickerCodes, setSelectedStickerCodes] = useState<string[]>([])
  const [selectionCartOpen, setSelectionCartOpen] = useState(false)
  const [data, setData] = useState<MarketSearchResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(filters.page))
    params.set('limit', '24')
    if (filters.type !== 'all') params.set('type', filters.type)
    if (filters.country) params.set('country', filters.country)
    if (filters.team) params.set('team', filters.team)
    params.set('order', filters.order)
    if (filters.q) params.set('q', filters.q)
    return params.toString()
  }, [filters])

  const loadMarket = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/market?${queryString}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load market')
      const payload = (await response.json()) as MarketSearchResponse
      setData(payload)
    } catch (error) {
      console.error('Error loading market:', error)
      if (!options?.silent) {
        setData({
          items: [],
          pagination: { page: filters.page, limit: 24, total: 0, totalPages: 0 },
        })
      }
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [filters.page, queryString])

  useEffect(() => {
    queueMicrotask(() => {
      void loadMarket()
    })
  }, [loadMarket])

  useMarketRealtime({
    onRefresh: () => {
      void loadMarket({ silent: true })
    },
  })

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

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const pagination = useMemo(
    () => data?.pagination ?? { page: 1, limit: 24, total: 0, totalPages: 0 },
    [data?.pagination],
  )
  const hasFullAccess = isAuthenticated
  const publisherUserId = useMemo(
    () => items.find((item) => item.user.publisherUserId)?.user.publisherUserId ?? null,
    [items],
  )
  const prefillMessage = useMemo(
    () => buildPrefillMessage(selectedStickerCodes),
    [selectedStickerCodes],
  )
  const teamOptions = useMemo<TeamOption[]>(
    () =>
      teams.map((team) => ({
        value: team,
        label: teamNames[team] || team,
      })),
    [],
  )
  const selectedTeamOption = useMemo(
    () => teamOptions.find((option) => option.value === filters.team) ?? null,
    [filters.team, teamOptions],
  )
  const countryOptions = useMemo<CountryOption[]>(
    () => COUNTRIES.map((country) => ({ value: country.code, label: country.name })),
    [],
  )
  const selectedCountryOption = useMemo(
    () => countryOptions.find((option) => option.value === filters.country) ?? null,
    [countryOptions, filters.country],
  )

  const toggleStickerSelection = (stickerCode: string) => {
    setSelectedStickerCodes((prev) => {
      const next = prev.includes(stickerCode) ? prev.filter((code) => code !== stickerCode) : [...prev, stickerCode]
      if (next.length === 0) {
        queueMicrotask(() => setSelectionCartOpen(false))
      }
      return next
    })
  }

  const clearStickerSelection = () => {
    setSelectedStickerCodes([])
    setSelectionCartOpen(false)
  }

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
            <Select<CountryOption, false>
              options={countryOptions}
              value={selectedCountryOption}
              isClearable
              isSearchable
              placeholder="Todos"
              noOptionsMessage={() => 'Sin coincidencias'}
              onChange={(option) =>
                setFilters((prev) => ({
                  ...prev,
                  country: option?.value || '',
                  page: 1,
                }))
              }
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: 'var(--bg)',
                  borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 12,
                  minHeight: 46,
                  boxShadow: 'none',
                  ':hover': { borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)' },
                }),
                singleValue: (base) => ({ ...base, color: 'var(--text)' }),
                input: (base) => ({ ...base, color: 'var(--text)' }),
                placeholder: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }),
                dropdownIndicator: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                clearIndicator: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--border)' }),
                menuPortal: (base) => ({ ...base, zIndex: 60 }),
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            />
          </label>

          <label className="market-filter-field">
            <span>Selección</span>
            <Select<TeamOption, false>
              options={teamOptions}
              value={selectedTeamOption}
              isClearable
              isSearchable
              placeholder="Todas"
              noOptionsMessage={() => 'Sin coincidencias'}
              onChange={(option) =>
                setFilters((prev) => ({
                  ...prev,
                  team: option?.value || '',
                  page: 1,
                }))
              }
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: 'var(--bg)',
                  borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 12,
                  minHeight: 46,
                  boxShadow: 'none',
                  ':hover': { borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)' },
                }),
                singleValue: (base) => ({ ...base, color: 'var(--text)' }),
                input: (base) => ({ ...base, color: 'var(--text)' }),
                placeholder: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }),
                dropdownIndicator: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                clearIndicator: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--border)' }),
                menuPortal: (base) => ({ ...base, zIndex: 60 }),
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            />
          </label>

          <label className="market-filter-field">
            <span>Orden por código</span>
            <Select<{ value: 'asc' | 'desc'; label: string }, false>
              options={[
                { value: 'asc', label: 'Ascendente (A-Z)' },
                { value: 'desc', label: 'Descendente (Z-A)' },
              ]}
              value={
                filters.order === 'desc'
                  ? { value: 'desc', label: 'Descendente (Z-A)' }
                  : { value: 'asc', label: 'Ascendente (A-Z)' }
              }
              isClearable={false}
              isSearchable={false}
              onChange={(option) =>
                setFilters((prev) => ({
                  ...prev,
                  order: option?.value || 'asc',
                  page: 1,
                }))
              }
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: 'var(--bg)',
                  borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 12,
                  minHeight: 46,
                  boxShadow: 'none',
                  ':hover': { borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)' },
                }),
                singleValue: (base) => ({ ...base, color: 'var(--text)' }),
                input: (base) => ({ ...base, color: 'var(--text)' }),
                placeholder: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }),
                dropdownIndicator: (base) => ({ ...base, color: 'var(--text-secondary)' }),
                indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--border)' }),
                menuPortal: (base) => ({ ...base, zIndex: 60 }),
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            />
          </label>

          <label className="market-filter-field market-filter-field-search">
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

                {hasFullAccess && item.listingType === 'offer' && (
                  <button
                    type="button"
                    className="btn-neutral-small"
                    onClick={() => toggleStickerSelection(item.stickerCode)}
                  >
                    {selectedStickerCodes.includes(item.stickerCode)
                      ? 'Quitar de mi consulta'
                      : 'Agregar a mi consulta'}
                  </button>
                )}

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

      {hasFullAccess && selectedStickerCodes.length > 0 && publisherUserId && (
        <>
          <button
            type="button"
            className={`market-selection-fab ${selectionCartOpen ? 'is-open' : 'is-pulsing'}`}
            aria-expanded={selectionCartOpen}
            aria-controls="market-selection-cart"
            onClick={() => setSelectionCartOpen((prev) => !prev)}
          >
            <span className="market-selection-fab-icon" aria-hidden="true">
              🏆
            </span>
            <span className="market-selection-fab-label">
              {selectionCartOpen ? 'Ocultar consulta' : 'Abrir consulta'}
            </span>
            <span className="market-selection-fab-count">{selectedStickerCodes.length}</span>
          </button>

          {selectionCartOpen && (
            <aside id="market-selection-cart" className="market-selection-cart card" aria-live="polite">
              <div className="market-selection-cart-head">
                <p className="market-selection-cart-title">Consulta rápida</p>
                <button type="button" className="btn-neutral-small" onClick={clearStickerSelection}>
                  Limpiar
                </button>
              </div>
              <p className="muted-small">
                {selectedStickerCodes.length} figurita{selectedStickerCodes.length === 1 ? '' : 's'} seleccionada
                {selectedStickerCodes.length === 1 ? '' : 's'}.
              </p>
              <p className="market-selection-cart-codes">{selectedStickerCodes.join(', ')}</p>
              <StartChatButton
                participantUserId={publisherUserId}
                label="Chatear con la empresa"
                className="btn-primary"
                prefillMessage={prefillMessage}
              />
            </aside>
          )}
        </>
      )}
    </div>
  )
}
