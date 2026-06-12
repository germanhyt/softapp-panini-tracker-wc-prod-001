'use client'

import { useCallback, useMemo, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import type { MarketSelectionItem, MarketSelectionState } from '@/lib/market/selection'

type SelectionTab = 'offers' | 'wants'

function filterItems(items: MarketSelectionItem[], query: string): MarketSelectionItem[] {
  const q = query.trim().toUpperCase()
  if (!q) return items
  return items.filter((item) => item.code.includes(q))
}

type SelectionListProps = {
  items: MarketSelectionItem[]
  query: string
  emptyText: string
  onToggle: (code: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

function SelectionList({ items, query, emptyText, onToggle, onSelectAll, onClearAll }: SelectionListProps) {
  const visible = useMemo(() => filterItems(items, query), [items, query])

  if (items.length === 0) {
    return <p className="market-selection-empty">{emptyText}</p>
  }

  return (
    <>
      <div className="market-selection-toolbar">
        <button type="button" className="btn-neutral-small" onClick={onSelectAll}>
          Marcar todas
        </button>
        <button type="button" className="btn-neutral-small" onClick={onClearAll}>
          Limpiar
        </button>
        <span className="muted-small">
          {items.filter((item) => item.selected).length} de {items.length} elegidas
        </span>
      </div>

      <div className="market-selection-grid">
        {visible.map((item) => (
          <label key={item.code} className={`market-selection-item ${item.selected ? 'is-selected' : ''}`}>
            <input type="checkbox" checked={item.selected} onChange={() => onToggle(item.code)} />
            <span className="market-selection-code">{item.code}</span>
            {item.quantity > 1 && <span className="market-selection-qty">x{item.quantity}</span>}
          </label>
        ))}
      </div>

      {visible.length === 0 && <p className="muted-small">Ningún código coincide con la búsqueda.</p>}
    </>
  )
}

export function MarketSelectionPanel() {
  const [state, setState] = useState<MarketSelectionState | null>(null)
  const [draftOffers, setDraftOffers] = useState<MarketSelectionItem[]>([])
  const [draftWants, setDraftWants] = useState<MarketSelectionItem[]>([])
  const [selectiveOffers, setSelectiveOffers] = useState(false)
  const [selectiveWants, setSelectiveWants] = useState(false)
  const [tab, setTab] = useState<SelectionTab>('offers')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const applyState = useCallback((payload: MarketSelectionState) => {
    setState(payload)
    setDraftOffers(payload.offers)
    setDraftWants(payload.wants)
    setSelectiveOffers(payload.selectiveOffers)
    setSelectiveWants(payload.selectiveWants)
  }, [])

  const loadSelections = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/market/selections')
      if (!response.ok) throw new Error('Failed to load selections')
      const payload = (await response.json()) as MarketSelectionState
      applyState(payload)
    } catch (loadError) {
      console.error('Error loading market selections:', loadError)
      setError('No se pudieron cargar las figuritas para publicar.')
    } finally {
      setLoading(false)
    }
  }, [applyState])

  useOnMount(() => loadSelections())

  const toggleItem = (listingType: SelectionTab, code: string) => {
    if (listingType === 'offers') {
      setDraftOffers((prev) =>
        prev.map((item) => (item.code === code ? { ...item, selected: !item.selected } : item)),
      )
      return
    }

    setDraftWants((prev) =>
      prev.map((item) => (item.code === code ? { ...item, selected: !item.selected } : item)),
    )
  }

  const setAll = (listingType: SelectionTab, selected: boolean) => {
    if (listingType === 'offers') {
      setDraftOffers((prev) => prev.map((item) => ({ ...item, selected })))
      return
    }
    setDraftWants((prev) => prev.map((item) => ({ ...item, selected })))
  }

  const saveSelections = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/market/selections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectiveOffers,
          selectiveWants,
          offerCodes: selectiveOffers ? draftOffers.filter((item) => item.selected).map((item) => item.code) : [],
          wantCodes: selectiveWants ? draftWants.filter((item) => item.selected).map((item) => item.code) : [],
        }),
      })

      if (!response.ok) throw new Error('Failed to save selections')

      const payload = (await response.json()) as MarketSelectionState
      applyState(payload)
      setMessage('Selección guardada y mercado actualizado.')
    } catch (saveError) {
      console.error('Error saving market selections:', saveError)
      setError('No se pudo guardar la selección.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="card market-selection-card">
        <p className="loading">Cargando figuritas para publicar...</p>
      </section>
    )
  }

  const activeItems = tab === 'offers' ? draftOffers : draftWants
  const selectiveActive = tab === 'offers' ? selectiveOffers : selectiveWants

  return (
    <section className="card market-selection-card">
      <div className="market-selection-head">
        <h3 className="text-lg font-semibold">Elegir qué publicar</h3>
        <p className="muted-small">
          Por defecto se publican todas tus repetidas o faltantes. Activa la selección manual para mostrar solo las
          figuritas que elijas.
        </p>
      </div>

      <div className="market-selection-tabs" role="tablist" aria-label="Tipo de publicación">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'offers'}
          className={`market-selection-tab ${tab === 'offers' ? 'is-active' : ''}`}
          onClick={() => {
            setTab('offers')
            setQuery('')
          }}
        >
          Repetidas ({draftOffers.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'wants'}
          className={`market-selection-tab ${tab === 'wants' ? 'is-active' : ''}`}
          onClick={() => {
            setTab('wants')
            setQuery('')
          }}
        >
          Faltantes ({draftWants.length})
        </button>
      </div>

      <label className="market-selection-mode">
        <input
          type="checkbox"
          checked={tab === 'offers' ? selectiveOffers : selectiveWants}
          onChange={(event) => {
            if (tab === 'offers') {
              setSelectiveOffers(event.target.checked)
              if (event.target.checked && draftOffers.every((item) => !item.selected)) {
                setDraftOffers((prev) => prev.map((item) => ({ ...item, selected: true })))
              }
              return
            }

            setSelectiveWants(event.target.checked)
            if (event.target.checked && draftWants.every((item) => !item.selected)) {
              setDraftWants((prev) => prev.map((item) => ({ ...item, selected: true })))
            }
          }}
        />
        <span>
          Publicar solo las {tab === 'offers' ? 'repetidas' : 'faltantes'} que marque abajo
        </span>
      </label>

      {!selectiveActive ? (
        <p className="market-selection-hint muted-small">
          Modo automático: se publicarán todas las {tab === 'offers' ? 'repetidas' : 'faltantes'} al sincronizar el
          mercado.
        </p>
      ) : (
        <>
          <input
            className="market-selection-search"
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            placeholder="Buscar código (ej. PER1)"
          />

          <SelectionList
            items={activeItems}
            query={query}
            emptyText={
              tab === 'offers'
                ? 'No tienes repetidas registradas en el álbum.'
                : 'No tienes faltantes en el catálogo estándar.'
            }
            onToggle={(code) => toggleItem(tab, code)}
            onSelectAll={() => setAll(tab, true)}
            onClearAll={() => setAll(tab, false)}
          />
        </>
      )}

      <div className="market-selection-actions">
        <button type="button" className="btn-primary" disabled={saving} onClick={() => void saveSelections()}>
          {saving ? 'Guardando...' : 'Guardar selección y actualizar mercado'}
        </button>
        <button type="button" className="btn-neutral-small" disabled={saving} onClick={() => void loadSelections()}>
          Recargar
        </button>
      </div>

      {state && (
        <p className="muted-small">
          Publicación actual:{' '}
          {state.selectiveOffers
            ? `${state.selectedOfferCount} repetidas elegidas`
            : 'todas las repetidas'}
          {' · '}
          {state.selectiveWants ? `${state.selectedWantCount} faltantes elegidas` : 'todas las faltantes'}
        </p>
      )}

      {message && <p className="market-message-success">{message}</p>}
      {error && <p className="market-message-error">{error}</p>}
    </section>
  )
}
