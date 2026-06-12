'use client'

import type { StickerState } from '@/lib/domain/sticker-rules'
import { confirmDialog } from '@/lib/ui/sweetalert'

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
  const handleToggleOwned = async (code: string, currentOwned: boolean, locked: boolean) => {
    if (locked && currentOwned) {
      const confirmed = await confirmDialog({
        title: '¿Desmarcar figurita guardada?',
        html: `Se quitará <strong>${code}</strong> de tu álbum en la nube, incluidas sus repetidas.<br><br>Esta acción no se puede deshacer desde aquí.`,
        confirmText: 'Sí, desmarcar',
        icon: 'warning',
      })
      if (!confirmed || !onDeleteSaved) return
      await onDeleteSaved(code)
      return
    }

    if (currentOwned) {
      const confirmed = await confirmDialog({
        title: '¿Desmarcar figurita?',
        html: `Se quitará la marca de <strong>${code}</strong>. Aún no está guardada en tu cuenta.`,
        confirmText: 'Sí, desmarcar',
        icon: 'warning',
      })
      if (!confirmed) return
      onUpdate(code, { owned: false })
      return
    }

    onUpdate(code, { owned: true })
  }

  const handleDuplicateChange = (code: string, currentDup: number, delta: number) => {
    onUpdate(code, { duplicates: Math.max(0, currentDup + delta) })
  }

  return (
    <div className="sticker-grid">
      {stickers.map(({ code, owned, duplicates, locked, pending }) => (
        <div
          key={code}
          className={`sticker-item ${owned ? 'owned' : ''} ${locked ? 'locked' : ''} ${pending ? 'pending' : ''}`.trim()}
          role="button"
          tabIndex={0}
          onClick={() => void handleToggleOwned(code, owned, locked)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              void handleToggleOwned(code, owned, locked)
            }
          }}
          title={
            locked
              ? 'Ya guardada. Toca para eliminar de tu cuenta.'
              : owned
                ? 'Desmarcar (aún no guardada)'
                : 'Marcar como pegada'
          }
        >
          <span className="code">{code}</span>
          <div className="checkbox" aria-hidden="true">
            {owned ? '✓' : ''}
          </div>
          {pending && <span className="pending-chip">Pendiente</span>}

          {owned && (
            <div className="dup-controls" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleDuplicateChange(code, duplicates, -1)}
                disabled={duplicates <= 0}
                aria-label={`Quitar repetida de ${code}`}
              >
                -
              </button>
              <span className="dup-count">{duplicates}</span>
              <button
                type="button"
                onClick={() => handleDuplicateChange(code, duplicates, 1)}
                aria-label={`Agregar repetida de ${code}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
