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
import { alertSuccess, confirmDialog } from '@/lib/ui/sweetalert'

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
    markMissingAsOwned,
    unmarkUnlockedOwned,
    clearAllSavedOwned,
    saveStickersByCodes,
    saveToCloud,
    deleteSavedSticker,
    isStickerLocked,
  } = useStickers()

  const albumPages = useMemo(() => buildAlbumPages(), [])
  const allAlbumCodes = useMemo(() => albumPages.flatMap((page) => page.codes), [albumPages])
  const initialQuery = searchParams.get('q') || ''
  const initialPageParam = Number(searchParams.get('page') || '1')

  const [query, setQuery] = useState(initialQuery.toUpperCase())
  const [currentPageIndex, setCurrentPageIndex] = useState(
    Math.min(Math.max(initialPageParam - 1, 0), albumPages.length - 1),
  )
  const [savedFlash, setSavedFlash] = useState(false)

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
      afterSave?.()
    }
    return success
  }

  const saveAllPending = async (afterSave?: () => void) => {
    const success = await saveToCloud()
    if (success) {
      flashSaved()
      afterSave?.()
    }
    return success
  }

  const tryChangePage = async (nextIndex: number) => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), albumPages.length - 1)
    if (safeIndex === currentPageIndex) return

    const pageHasChanges = currentPage.codes.some((code) => pendingChanges[code])
    if (pageHasChanges) {
      const shouldSave = await confirmDialog({
        title: 'Cambios sin guardar',
        text: 'Tienes cambios sin guardar en esta página. ¿Guardar ahora y continuar?',
        confirmText: 'Guardar y continuar',
        icon: 'warning',
      })
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

  const missingAlbumCount = useMemo(
    () =>
      allAlbumCodes.filter((code) => {
        if (isStickerLocked(code)) return false
        return !stickers[code]?.owned
      }).length,
    [allAlbumCodes, isStickerLocked, stickers],
  )

  const pendingOwnedCount = useMemo(
    () =>
      allAlbumCodes.filter((code) => {
        if (isStickerLocked(code)) return false
        return stickers[code]?.owned
      }).length,
    [allAlbumCodes, isStickerLocked, stickers],
  )

  const savedAlbumCount = useMemo(
    () => allAlbumCodes.filter((code) => isStickerLocked(code)).length,
    [allAlbumCodes, isStickerLocked],
  )

  const savedDuplicatesCount = useMemo(
    () =>
      allAlbumCodes.reduce((total, code) => {
        if (!isStickerLocked(code)) return total
        return total + (Number(stickers[code]?.duplicates) || 0)
      }, 0),
    [allAlbumCodes, isStickerLocked, stickers],
  )

  const getSelectableCodes = (codes: string[]) => codes.filter((code) => !isStickerLocked(code))

  const getBulkSelectionState = (codes: string[]) => {
    const selectableCodes = getSelectableCodes(codes)
    const selectedCodes = selectableCodes.filter((code) => stickers[code]?.owned)
    const hasSelectable = selectableCodes.length > 0
    const hasSelected = selectedCodes.length > 0
    return { selectableCodes, selectedCodes, hasSelectable, hasSelected }
  }

  const toggleBulkSelection = async (codes: string[]) => {
    const { selectableCodes, selectedCodes, hasSelected } = getBulkSelectionState(codes)
    if (selectableCodes.length === 0) return

    if (hasSelected) {
      const confirmed = await confirmDialog({
        title: '¿Desmarcar página?',
        html: `Se quitará la marca de <strong>${selectedCodes.length}</strong> figurita${selectedCodes.length === 1 ? '' : 's'} pendiente${selectedCodes.length === 1 ? '' : 's'} de guardar.<br><br>Las ya guardadas en tu cuenta no se modifican.`,
        confirmText: 'Sí, desmarcar',
        icon: 'warning',
      })
      if (!confirmed) return
      selectedCodes.forEach((code) => updateStickerLocal(code, { owned: false }))
      return
    }

    selectableCodes.forEach((code) => updateStickerLocal(code, { owned: true }))
  }

  const handleMarkAlbumComplete = async () => {
    if (missingAlbumCount === 0) return

    const confirmed = await confirmDialog({
      title: '¿Completar álbum?',
      html: `Se marcarán <strong>${missingAlbumCount}</strong> figurita${missingAlbumCount === 1 ? '' : 's'} como pegadas.<br><br>Las que ya guardaste (incluidas sus repetidas) <strong>no se modificarán</strong>.`,
      confirmText: 'Sí, marcar faltantes',
      icon: 'question',
    })
    if (!confirmed) return

    const markedCodes = markMissingAsOwned(allAlbumCodes)
    if (markedCodes.length === 0) return

    await alertSuccess({
      title: 'Marcado listo',
      text: `${markedCodes.length} figurita${markedCodes.length === 1 ? '' : 's'} marcada${markedCodes.length === 1 ? '' : 's'}. Recuerda guardar para que quede en tu cuenta.`,
    })
  }

  const handleUnmarkAlbumPending = async () => {
    if (pendingOwnedCount === 0) return

    const confirmed = await confirmDialog({
      title: '¿Desmarcar pendientes?',
      html: `Se quitará la marca de <strong>${pendingOwnedCount}</strong> figurita${pendingOwnedCount === 1 ? '' : 's'} que aún no guardaste.<br><br>Las figuritas ya guardadas en tu cuenta <strong>no se tocan</strong>.`,
      confirmText: 'Sí, desmarcar',
      icon: 'warning',
    })
    if (!confirmed) return

    const unmarkedCodes = unmarkUnlockedOwned(allAlbumCodes)
    if (unmarkedCodes.length === 0) return

    await alertSuccess({
      title: 'Desmarcado listo',
      text: `${unmarkedCodes.length} figurita${unmarkedCodes.length === 1 ? '' : 's'} sin marcar.`,
    })
  }

  const handleClearAllSaved = async () => {
    if (savedAlbumCount === 0) return

    const duplicatesNote =
      savedDuplicatesCount > 0
        ? `<br><br>También se perderán <strong>${savedDuplicatesCount}</strong> repetida${savedDuplicatesCount === 1 ? '' : 's'} registrada${savedDuplicatesCount === 1 ? '' : 's'}.`
        : ''

    const confirmed = await confirmDialog({
      title: '¿Desmarcar todo lo guardado?',
      html: `Se quitarán <strong>${savedAlbumCount}</strong> figurita${savedAlbumCount === 1 ? '' : 's'} de tu álbum en la nube.${duplicatesNote}<br><br>Puede afectar tu publicación en el mercado. <strong>Esta acción no se puede deshacer automáticamente.</strong>`,
      confirmText: 'Sí, desmarcar todo guardado',
      cancelText: 'Cancelar',
      icon: 'warning',
    })
    if (!confirmed) return

    const clearedCodes = await clearAllSavedOwned(allAlbumCodes)
    if (clearedCodes.length === 0) return

    await alertSuccess({
      title: 'Álbum guardado limpiado',
      text: `${clearedCodes.length} figurita${clearedCodes.length === 1 ? '' : 's'} desmarcada${clearedCodes.length === 1 ? '' : 's'} de tu cuenta.`,
    })
  }

  if (loading) {
    return <div className="loading">📖 Cargando álbum...</div>
  }

  return (
    <div className="album-page">
      <header className="album-head">
        <Link href="/dashboard" className="ghost-back">
          ←
        </Link>
        <div>
          <h2>📖 Ver álbum</h2>
          <p className="muted-small">Marca por página, busca por código y guarda antes de cambiar de sección.</p>
        </div>
      </header>

      {error && <div className="card error-banner">{error}</div>}

      <section className={`card album-toolbar ${query.trim() ? 'is-search-mode' : ''}`}>
        <div className="album-toolbar-search">
          <label htmlFor="album-search-input">Buscar</label>
          <div className="album-search-row">
            <input
              id="album-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="ARG5, FWC…"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="btn-clear-search">
                ×
              </button>
            )}
          </div>
        </div>

        {!query.trim() ? (
          <div className="album-toolbar-page">
            <label htmlFor="album-page-select">Página del álbum</label>
            <div className="album-page-nav">
              <button
                type="button"
                className="album-page-nav-btn"
                onClick={() => tryChangePage(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
                aria-label="Página anterior"
              >
                ←
              </button>
              <select
                id="album-page-select"
                className="album-page-select"
                value={currentPageIndex}
                onChange={(e) => tryChangePage(Number(e.target.value))}
              >
                {albumPages.map((page, index) => (
                  <option key={page.id} value={index}>
                    Pág. {page.albumLabel || padPage(page.number)} · {page.title.replace(/^[^\wÀ-ÿ]+\s*/, '')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="album-page-nav-btn"
                onClick={() => tryChangePage(currentPageIndex + 1)}
                disabled={currentPageIndex === albumPages.length - 1}
                aria-label="Página siguiente"
              >
                →
              </button>
            </div>
          </div>
        ) : (
          <div className="album-toolbar-results">
            <span className="album-search-summary-inline">
              <strong>{visibleCodes.length}</strong> resultado{visibleCodes.length === 1 ? '' : 's'} ·{' '}
              <strong>{query}</strong>
            </span>
          </div>
        )}
      </section>

      {!query.trim() && (
        <section className="card album-actions-bar" aria-label="Acciones del álbum">
          <p className="album-actions-kicker">Acciones del álbum</p>
          <p className="muted-small album-actions-hint">
            Toca una acción para marcar o desmarcar en bloque. Los contadores muestran cuántas figuritas se verán afectadas.
          </p>
          <div className="album-complete-actions">
            <button
              type="button"
              className={`album-complete-btn ${missingAlbumCount > 0 ? 'active' : ''}`}
              onClick={() => void handleMarkAlbumComplete()}
              disabled={saving || missingAlbumCount === 0}
            >
              <span className="album-action-label">Marcar faltantes</span>
              <span className="album-action-count">{missingAlbumCount === 0 ? '✓' : missingAlbumCount}</span>
            </button>
            <button
              type="button"
              className={`album-complete-btn album-complete-btn-muted ${pendingOwnedCount > 0 ? 'active-muted' : ''}`}
              onClick={() => void handleUnmarkAlbumPending()}
              disabled={saving || pendingOwnedCount === 0}
            >
              <span className="album-action-label">Desmarcar pendientes</span>
              <span className="album-action-count">{pendingOwnedCount}</span>
            </button>
            <button
              type="button"
              className={`album-complete-btn album-complete-btn-danger ${savedAlbumCount > 0 ? 'active-danger' : ''}`}
              onClick={() => void handleClearAllSaved()}
              disabled={saving || savedAlbumCount === 0}
            >
              <span className="album-action-label">Desmarcar guardadas</span>
              <span className="album-action-count">{savedAlbumCount}</span>
            </button>
          </div>
        </section>
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
        const { hasSelectable, hasSelected } = getBulkSelectionState(page.codes)

        return (
          <section key={page.id} className="album-page-section card">
            <div className="album-page-title-row">
              <div className="album-page-heading">
                <h3>
                  Pág. {page.albumLabel || padPage(page.number)} · {page.title}
                </h3>
                <p className="album-page-stats">
                  <span>
                    {ownedCount}/{page.codes.length} pegadas
                  </span>
                  <span className="album-page-duplicates">{pageDuplicates} repetidas</span>
                </p>
              </div>
              <div className="album-page-actions">
                <button
                  type="button"
                  className={`album-select-button ${hasSelected ? 'active' : ''}`}
                  onClick={() => void toggleBulkSelection(page.codes)}
                  disabled={saving || !hasSelectable}
                >
                  {hasSelected ? 'Desmarcar página' : 'Seleccionar todas'}
                </button>
                <button
                  type="button"
                  className={`album-inline-save ${pageHasChanges ? 'active' : ''}`}
                  onClick={() => saveCodes(page.codes)}
                  disabled={saving || !pageHasChanges}
                >
                  {saving && pageHasChanges
                    ? 'Guardando…'
                    : savedFlash && !pageHasChanges
                      ? '✅ Listo'
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
