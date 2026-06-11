'use client'

import { useState } from 'react'
import type { StickerState } from '@/lib/domain/sticker-rules'

type GridSticker = {
  code: string
  owned: boolean
  duplicates: number
  locked: boolean
  pending: boolean
}

type StickerGridProps = {
  stickers: GridSticker[]
  onUpdate: (code: string, updates: Partial<StickerState>) => void
  onDeleteSaved?: (code: string) => Promise<boolean>
}

export function StickerGrid({ stickers, onUpdate, onDeleteSaved }: StickerGridProps) {
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleToggleOwned = (code: string, currentOwned: boolean, locked: boolean) => {
    if (locked && currentOwned) {
      setDeleteCandidate((prev) => (prev === code ? null : code))
      return
    }

    setDeleteCandidate(null)
    onUpdate(code, { owned: !currentOwned })
  }

  const handleDuplicateChange = (code: string, currentDup: number, delta: number) => {
    onUpdate(code, { duplicates: Math.max(0, currentDup + delta) })
  }

  const confirmDelete = async (code: string) => {
    if (!onDeleteSaved) return
    setDeleting(true)
    const ok = await onDeleteSaved(code)
    setDeleting(false)
    if (ok) setDeleteCandidate(null)
  }

  return (
    <div className="sticker-grid">
      {stickers.map(({ code, owned, duplicates, locked, pending }) => (
        <div
          key={code}
          className={`sticker-item ${owned ? 'owned' : ''} ${locked ? 'locked' : ''} ${pending ? 'pending' : ''}`.trim()}
        >
          <span className="code">{code}</span>
          <div
            className="checkbox"
            onClick={() => handleToggleOwned(code, owned, locked)}
            title={
              locked
                ? 'Ya fue guardada. Toca para eliminar con confirmación.'
                : owned
                  ? 'Quitar antes de guardar'
                  : 'Marcar como pegada'
            }
          >
            {owned ? '✓' : ''}
          </div>
          {pending && <span className="pending-chip">Pendiente</span>}

          {owned && (
            <div className="dup-controls">
              <button
                type="button"
                onClick={() => handleDuplicateChange(code, duplicates, -1)}
                disabled={duplicates <= 0}
              >
                -
              </button>
              <span className="dup-count">{duplicates}</span>
              <button type="button" onClick={() => handleDuplicateChange(code, duplicates, 1)}>
                +
              </button>
            </div>
          )}

          {!owned && <div style={{ height: 28, marginTop: 6 }} />}

          {deleteCandidate === code && locked && owned && onDeleteSaved && (
            <div className="delete-sticker-box">
              <p>¿Eliminar {code} de tu álbum guardado?</p>
              <div className="delete-sticker-actions">
                <button type="button" className="btn-secondary" onClick={() => setDeleteCandidate(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={deleting}
                  onClick={() => confirmDelete(code)}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
