'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  buildAlbumPages,
  filterCodesByQuery,
  pageMatchesQuery,
  padPage,
} from '@/lib/domain/album-pages'
import { StickerGrid } from '@/components/stickers/sticker-grid'
import { useStickers } from '@/hooks/use-stickers'

export function AlbumView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    stickers,
    pendingChanges,
    loading,
    saving,
    error,
    updateStickerLocal,
    saveStickersByCodes,
    saveToCloud,
    deleteSavedSticker,
    isStickerLocked,
  } = useStickers()

  const albumPages = useMemo(() => buildAlbumPages(), [])
  const initialQuery = searchParams.get('q') || ''
  const initialPageParam = Number(searchParams.get('page') || '1')

  const [query, setQuery] = useState(initialQuery.toUpperCase())
  const [currentPageIndex, setCurrentPageIndex] = useState(
    Math.min(Math.max(initialPageParam - 1, 0), albumPages.length - 1),
  )
  const [savedFlash, setSavedFlash] = useState(false)
  const [bulkSelectionModes, setBulkSelectionModes] = useState<Record<string, boolean>>({})

  const currentPage = albumPages[currentPageIndex]
  const hasAnyChanges = Object.keys(pendingChanges).length > 0

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    else params.set('page', String(currentPage.number))
    router.replace(`/album?${params.toString()}`, { scroll: false })
  }, [query, currentPage.number, router])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasAnyChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasAnyChanges])

  const flashSaved = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  const saveCodes = async (codes: string[], afterSave?: () => void) => {
    const success = await saveStickersByCodes(codes)
    if (success) {
      flashSaved()
      setBulkSelectionModes({})
      afterSave?.()
    }
    return success
  }

  const saveAllPending = async (afterSave?: () => void) => {
    const success = await saveToCloud()
    if (success) {
      flashSaved()
      setBulkSelectionModes({})
      afterSave?.()
    }
    return success
  }

  const tryChangePage = async (nextIndex: number) => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), albumPages.length - 1)
    if (safeIndex === currentPageIndex) return

    const pageHasChanges = currentPage.codes.some((code) => pendingChanges[code])
    if (pageHasChanges) {
      const shouldSave = window.confirm(
        'Tienes cambios sin guardar en esta página. ¿Guardar ahora y continuar?',
      )
      if (!shouldSave) return
      await saveCodes(currentPage.codes, () => setCurrentPageIndex(safeIndex))
      return
    }

    setCurrentPageIndex(safeIndex)
  }

  const visiblePages = useMemo(() => {
    if (!query.trim()) return [currentPage]

    return albumPages
      .filter((page) => pageMatchesQuery(page, query))
      .map((page) => ({ ...page, codes: filterCodesByQuery(page, query) }))
      .filter((page) => page.codes.length > 0)
  }, [albumPages, currentPage, query])

  const visibleCodes = visiblePages.flatMap((page) => page.codes)
  const hasVisibleChanges = visibleCodes.some((code) => pendingChanges[code])

  const getSelectableCodes = (codes: string[]) => codes.filter((code) => !isStickerLocked(code))

  const getBulkSelectionState = (pageId: string, codes: string[]) => {
    const selectableCodes = getSelectableCodes(codes)
    const selectedCodes = selectableCodes.filter((code) => stickers[code]?.owned)
    const hasSelectable = selectableCodes.length > 0
    const isAnulable = Boolean(bulkSelectionModes[pageId]) && selectedCodes.length > 0
    return { selectableCodes, selectedCodes, hasSelectable, isAnulable }
  }

  const toggleBulkSelection = (pageId: string, codes: string[]) => {
    const { selectableCodes, selectedCodes, isAnulable } = getBulkSelectionState(pageId, codes)
    if (selectableCodes.length === 0) return

    if (isAnulable) {
      selectedCodes.forEach((code) => updateStickerLocal(code, { owned: false }))
      setBulkSelectionModes((prev) => ({ ...prev, [pageId]: false }))
      return
    }

    selectableCodes.forEach((code) => updateStickerLocal(code, { owned: true }))
    setBulkSelectionModes((prev) => ({ ...prev, [pageId]: true }))
  }

  if (loading) {
    return <div className="loading">📖 Cargando álbum...</div>
  }

  return (
    <div>
      <div className="album-head">
        <Link href="/dashboard" className="ghost-back">
          ←
        </Link>
        <div>
          <h2>📖 Ver álbum</h2>
          <p>Marca tus tarjetas por página, busca por selección o código y guarda antes de cambiar de página.</p>
        </div>
      </div>

      {error && <div className="card error-banner">{error}</div>}

      <div className="album-search-card card">
        <label>Buscar dentro del álbum</label>
        <div className="album-search-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Ej: ARG, ARG5, Brazil, FWC, 01..."
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="btn-clear-search">
              Limpiar
            </button>
          )}
        </div>
        <small className="muted-small">La búsqueda es dinámica. No necesitas presionar un botón.</small>
      </div>

      {!query.trim() && (
        <div className="album-page-nav card">
          <button type="button" onClick={() => tryChangePage(currentPageIndex - 1)} disabled={currentPageIndex === 0}>
            ← Anterior
          </button>
          <select
            value={currentPageIndex}
            onChange={(e) => tryChangePage(Number(e.target.value))}
          >
            {albumPages.map((page, index) => (
              <option key={page.id} value={index}>
                Pág. {page.albumLabel || padPage(page.number)} - {page.title.replace(/^[^\wÀ-ÿ]+\s*/, '')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => tryChangePage(currentPageIndex + 1)}
            disabled={currentPageIndex === albumPages.length - 1}
          >
            Siguiente →
          </button>
        </div>
      )}

      {query.trim() && (
        <div className="album-search-summary card">
          <strong>{visibleCodes.length}</strong> resultado(s) para <strong>{query}</strong>
        </div>
      )}

      {visiblePages.length === 0 && (
        <div className="card">
          <p>
            No encontré resultados para <strong>{query}</strong>.
          </p>
        </div>
      )}

      {visiblePages.map((page) => {
        const pageStickers = page.codes.map((code) => ({
          code,
          owned: stickers[code]?.owned || false,
          duplicates: stickers[code]?.duplicates || 0,
          locked: isStickerLocked(code),
          pending: Boolean(pendingChanges[code]),
        }))
        const ownedCount = page.codes.filter((code) => stickers[code]?.owned).length
        const pageDuplicates = page.codes.reduce(
          (total, code) => total + (Number(stickers[code]?.duplicates) || 0),
          0,
        )
        const pageHasChanges = page.codes.some((code) => pendingChanges[code])
        const { hasSelectable, isAnulable } = getBulkSelectionState(page.id, page.codes)

        return (
          <section key={page.id} className="album-page-section card">
            <div className="album-page-title-row">
              <div>
                <h3>
                  Pág. {page.albumLabel || padPage(page.number)} · {page.title}
                </h3>
                <p>
                  {page.subtitle} · {ownedCount}/{page.codes.length}{' '}
                  <span className="album-page-duplicates">- {pageDuplicates} repetidas</span>
                </p>
              </div>
              <div className="album-page-actions">
                <button
                  type="button"
                  className={`album-select-button ${isAnulable ? 'active' : ''}`}
                  onClick={() => toggleBulkSelection(page.id, page.codes)}
                  disabled={saving || !hasSelectable}
                >
                  {isAnulable ? 'Anular Selección' : 'Seleccionar Todas'}
                </button>
                <button
                  type="button"
                  className={`album-inline-save ${pageHasChanges ? 'active' : ''}`}
                  onClick={() => saveCodes(page.codes)}
                  disabled={saving || !pageHasChanges}
                >
                  {saving && pageHasChanges
                    ? 'Guardando...'
                    : savedFlash && !pageHasChanges
                      ? '✅ Guardado'
                      : '💾 Guardar'}
                </button>
              </div>
            </div>

            <StickerGrid
              stickers={pageStickers}
              onUpdate={updateStickerLocal}
              onDeleteSaved={deleteSavedSticker}
            />
          </section>
        )
      })}

      {query.trim() && hasVisibleChanges && (
        <button
          type="button"
          className="btn-save"
          onClick={() => saveCodes(visibleCodes)}
          disabled={saving || !hasVisibleChanges}
        >
          {saving ? 'Guardando...' : savedFlash ? '✅ Guardado' : '💾 Guardar cambios visibles'}
        </button>
      )}

      {!query.trim() && hasAnyChanges && (
        <button type="button" className="btn-save" onClick={() => saveAllPending()} disabled={saving}>
          {saving ? 'Guardando...' : '💾 Guardar todos los cambios pendientes'}
        </button>
      )}
    </div>
  )
}
