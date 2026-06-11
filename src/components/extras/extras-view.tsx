'use client'

import { useMemo, useState } from 'react'
import { STANDARD_CODE_SET } from '@/lib/domain/catalog'
import { normalizeStickerState } from '@/lib/domain/sticker-rules'
import { useStickers } from '@/hooks/use-stickers'

export function ExtrasView() {
  const { stickers, pendingChanges, updateStickerLocal, saveToCloud, isStickerLocked, deleteSavedSticker, loading } =
    useStickers()
  const extraCodes = useMemo(
    () =>
      Object.keys(stickers)
        .filter((code) => !STANDARD_CODE_SET.has(code))
        .sort((a, b) => a.localeCompare(b)),
    [stickers],
  )

  const [newCode, setNewCode] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const normalizedNewCode = newCode.trim().toUpperCase()
  const canAddExtra =
    Boolean(normalizedNewCode) &&
    !STANDARD_CODE_SET.has(normalizedNewCode) &&
    !extraCodes.includes(normalizedNewCode)

  const hasPendingExtras = useMemo(
    () => extraCodes.some((code) => pendingChanges[code]),
    [extraCodes, pendingChanges],
  )

  const addExtra = () => {
    const code = normalizedNewCode
    if (!canAddExtra) return
    updateStickerLocal(code, { owned: true, duplicates: 0 })
    setNewCode('')
  }

  const handleToggleExtra = (code: string, owned: boolean, locked: boolean) => {
    if (locked && owned) {
      setDeleteCandidate((prev) => (prev === code ? null : code))
      return
    }

    setDeleteCandidate(null)
    updateStickerLocal(code, { owned: !owned })
  }

  const confirmDelete = async (code: string) => {
    setDeleting(true)
    const success = await deleteSavedSticker(code)
    setDeleting(false)
    if (success) setDeleteCandidate(null)
  }

  if (loading) {
    return <div className="loading">📦 Cargando extras...</div>
  }

  return (
    <div>
      <h2 className="page-title">📦 Promocionales / Regionales</h2>
      <p className="muted-small extras-intro">
        Agrega códigos de pegatinas especiales que no están en la lista estándar.
      </p>

      <div className="extras-add-row">
        <input
          type="text"
          placeholder="Nuevo código (ej: PROMO1)"
          value={newCode}
          onChange={(event) => setNewCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addExtra()
          }}
        />
        <button type="button" onClick={addExtra} disabled={!canAddExtra} className={canAddExtra ? 'btn-primary' : 'btn-disabled'}>
          +
        </button>
      </div>

      {extraCodes.length === 0 && <p className="muted-small">No hay pegatinas extras agregadas aún.</p>}

      {extraCodes.map((code) => {
        const sticker = normalizeStickerState(stickers[code])
        const locked = isStickerLocked(code)

        return (
          <div key={code} className="card extra-sticker-card">
            <div className="extra-sticker-row">
              <div className="extra-sticker-main">
                <button
                  type="button"
                  className={`extra-checkbox ${sticker.owned ? 'owned' : ''} ${locked ? 'locked' : ''}`}
                  onClick={() => handleToggleExtra(code, sticker.owned, locked)}
                  title={
                    locked
                      ? 'Ya fue guardada. Toca para eliminar con confirmación segura.'
                      : sticker.owned
                        ? 'Quitar antes de guardar'
                        : 'Marcar como pegada'
                  }
                >
                  {sticker.owned ? '✓' : ''}
                </button>
                <strong>{code}</strong>
              </div>

              {sticker.owned && (
                <div className="dup-controls">
                  <button
                    type="button"
                    onClick={() => updateStickerLocal(code, { duplicates: Math.max(0, sticker.duplicates - 1) })}
                    disabled={sticker.duplicates <= 0}
                  >
                    -
                  </button>
                  <span className="dup-count">{sticker.duplicates}</span>
                  <button type="button" onClick={() => updateStickerLocal(code, { duplicates: sticker.duplicates + 1 })}>
                    +
                  </button>
                </div>
              )}
            </div>

            {deleteCandidate === code && locked && sticker.owned && (
              <div className="delete-sticker-box">
                <p>¿Eliminar {code} de tu álbum guardado?</p>
                <div className="delete-sticker-actions">
                  <button type="button" className="btn-secondary" onClick={() => setDeleteCandidate(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-primary" disabled={deleting} onClick={() => void confirmDelete(code)}>
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="extras-save-wrap">
        <button type="button" onClick={() => void saveToCloud()} className="btn-primary" disabled={!hasPendingExtras}>
          {hasPendingExtras ? '💾 Guardar extras' : '✅ Extras guardados'}
        </button>
      </div>
    </div>
  )
}
