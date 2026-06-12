'use client'

import { useCallback, useMemo, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import {
  applyStickerPatch,
  normalizeStickerCode,
  normalizeStickerState,
  stickersAreEqual,
  type StickerState,
} from '@/lib/domain/sticker-rules'
import { mergeSavedStickers, type StickerMap } from '@/lib/domain/progress'

type UseStickersResult = {
  loading: boolean
  error: string | null
  stickers: StickerMap
  savedStickers: StickerMap
  pendingChanges: Record<string, true>
  lastSaved: number | null
  saving: boolean
  updateStickerLocal: (code: string, updates: Partial<StickerState>) => void
  markMissingAsOwned: (codes: string[]) => string[]
  unmarkUnlockedOwned: (codes: string[]) => string[]
  clearAllSavedOwned: (codes: string[]) => Promise<string[]>
  saveStickersByCodes: (codes: string[]) => Promise<boolean>
  saveToCloud: () => Promise<boolean>
  deleteSavedSticker: (code: string) => Promise<boolean>
  isStickerLocked: (code: string) => boolean
  refresh: () => Promise<void>
}

async function fetchSaved(): Promise<StickerMap> {
  const response = await fetch('/api/stickers/me')
  if (!response.ok) {
    throw new Error('No se pudieron cargar tus figuritas')
  }
  const data = await response.json()
  return mergeSavedStickers(data.saved || {})
}

export function useStickers(): UseStickersResult {
  const [stickers, setStickers] = useState<StickerMap>(() => mergeSavedStickers())
  const [savedStickers, setSavedStickers] = useState<StickerMap>(() => mergeSavedStickers())
  const [pendingChanges, setPendingChanges] = useState<Record<string, true>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const saved = await fetchSaved()
      setSavedStickers(saved)
      setStickers(saved)
      setPendingChanges({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar figuritas')
    } finally {
      setLoading(false)
    }
  }, [])

  useOnMount(() => refresh())

  const isStickerLocked = useCallback(
    (code: string) => Boolean(savedStickers[normalizeStickerCode(code)]?.owned),
    [savedStickers],
  )

  const updateStickerLocal = useCallback(
    (code: string, updates: Partial<StickerState>) => {
      const normalizedCode = normalizeStickerCode(code)
      if (!normalizedCode) return

      setStickers((prev) => {
        const current = normalizeStickerState(prev[normalizedCode])
        const nextSticker = applyStickerPatch(current, updates, {
          alreadySavedAsOwned: Boolean(savedStickers[normalizedCode]?.owned),
        })
        const savedSticker = normalizeStickerState(savedStickers[normalizedCode])

        setPendingChanges((previousPending) => {
          const nextPending = { ...previousPending }
          if (stickersAreEqual(nextSticker, savedSticker)) {
            delete nextPending[normalizedCode]
          } else {
            nextPending[normalizedCode] = true
          }
          return nextPending
        })

        return {
          ...prev,
          [normalizedCode]: nextSticker,
        }
      })
    },
    [savedStickers],
  )

  const markMissingAsOwned = useCallback(
    (codes: string[]) => {
      const normalizedCodes = Array.from(
        new Set(codes.map((code) => normalizeStickerCode(code)).filter(Boolean)),
      )

      const codesToMark = normalizedCodes.filter((code) => {
        if (isStickerLocked(code)) return false
        return !normalizeStickerState(stickers[code]).owned
      })

      if (codesToMark.length === 0) return []

      const nextStickers: StickerMap = { ...stickers }
      codesToMark.forEach((code) => {
        nextStickers[code] = applyStickerPatch(normalizeStickerState(stickers[code]), { owned: true })
      })

      setStickers(nextStickers)
      setPendingChanges((prevPending) => {
        const nextPending = { ...prevPending }
        codesToMark.forEach((code) => {
          const nextSticker = nextStickers[code]
          const savedSticker = normalizeStickerState(savedStickers[code])
          if (stickersAreEqual(nextSticker, savedSticker)) {
            delete nextPending[code]
          } else {
            nextPending[code] = true
          }
        })
        return nextPending
      })

      return codesToMark
    },
    [isStickerLocked, savedStickers, stickers],
  )

  const unmarkUnlockedOwned = useCallback(
    (codes: string[]) => {
      const normalizedCodes = Array.from(
        new Set(codes.map((code) => normalizeStickerCode(code)).filter(Boolean)),
      )

      const codesToUnmark = normalizedCodes.filter((code) => {
        if (isStickerLocked(code)) return false
        return normalizeStickerState(stickers[code]).owned
      })

      if (codesToUnmark.length === 0) return []

      const nextStickers: StickerMap = { ...stickers }
      codesToUnmark.forEach((code) => {
        nextStickers[code] = applyStickerPatch(normalizeStickerState(stickers[code]), { owned: false })
      })

      setStickers(nextStickers)
      setPendingChanges((prevPending) => {
        const nextPending = { ...prevPending }
        codesToUnmark.forEach((code) => {
          const nextSticker = nextStickers[code]
          const savedSticker = normalizeStickerState(savedStickers[code])
          if (stickersAreEqual(nextSticker, savedSticker)) {
            delete nextPending[code]
          } else {
            nextPending[code] = true
          }
        })
        return nextPending
      })

      return codesToUnmark
    },
    [isStickerLocked, savedStickers, stickers],
  )

  const persistPatches = useCallback(
    async (codes: string[]) => {
      const normalizedCodes = Array.from(
        new Set(codes.map((code) => normalizeStickerCode(code)).filter(Boolean)),
      )

      if (normalizedCodes.length === 0) return false

      const patches = normalizedCodes.map((code) => ({
        code,
        ...normalizeStickerState(stickers[code]),
      }))

      setSaving(true)
      setError(null)

      try {
        const response = await fetch('/api/stickers/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patches }),
        })

        if (!response.ok) {
          throw new Error('Error al guardar en la base de datos')
        }

        const data = await response.json()
        const saved = mergeSavedStickers(data.saved || {})

        setSavedStickers(saved)
        setStickers((prev) => {
          const next = { ...prev }
          normalizedCodes.forEach((code) => {
            next[code] = normalizeStickerState(saved[code] || prev[code])
          })
          return next
        })

        setPendingChanges((prev) => {
          const next = { ...prev }
          normalizedCodes.forEach((code) => delete next[code])
          return next
        })

        setLastSaved(Date.now())
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
        return false
      } finally {
        setSaving(false)
      }
    },
    [stickers],
  )

  const saveStickersByCodes = useCallback(
    (codes: string[]) => persistPatches(codes),
    [persistPatches],
  )

  const saveToCloud = useCallback(
    () => persistPatches(Object.keys(pendingChanges)),
    [pendingChanges, persistPatches],
  )

  const clearAllSavedOwned = useCallback(
    async (codes: string[]) => {
      const normalizedCodes = Array.from(
        new Set(codes.map((code) => normalizeStickerCode(code)).filter(Boolean)),
      )
      const codesToClear = normalizedCodes.filter((code) => isStickerLocked(code))

      if (codesToClear.length === 0) return []

      setSaving(true)
      setError(null)

      try {
        const response = await fetch('/api/stickers/me/clear-saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes: codesToClear }),
        })

        if (!response.ok) {
          throw new Error('No se pudieron desmarcar las figuritas guardadas')
        }

        const data = await response.json()
        const saved = mergeSavedStickers(data.saved || {})
        const clearedCodes: string[] = Array.isArray(data.clearedCodes) ? data.clearedCodes : codesToClear
        const removed = { owned: false, duplicates: 0 }

        setSavedStickers(saved)
        setStickers((prev) => {
          const next = { ...prev }
          clearedCodes.forEach((code) => {
            next[code] = removed
          })
          return next
        })
        setPendingChanges((prev) => {
          const next = { ...prev }
          clearedCodes.forEach((code) => delete next[code])
          return next
        })
        setLastSaved(Date.now())
        return clearedCodes
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al desmarcar guardadas')
        return []
      } finally {
        setSaving(false)
      }
    },
    [isStickerLocked],
  )

  const deleteSavedSticker = useCallback(async (code: string) => {
    const normalizedCode = normalizeStickerCode(code)
    if (!normalizedCode) return false

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/stickers/me/${encodeURIComponent(normalizedCode)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('No se pudo eliminar la figurita guardada')
      }

      const data = await response.json()
      const saved = mergeSavedStickers(data.saved || {})
      const removed = { owned: false, duplicates: 0 }

      setSavedStickers(saved)
      setStickers((prev) => ({ ...prev, [normalizedCode]: removed }))
      setPendingChanges((prev) => {
        const next = { ...prev }
        delete next[normalizedCode]
        return next
      })
      setLastSaved(Date.now())
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return useMemo(
    () => ({
      loading,
      error,
      stickers,
      savedStickers,
      pendingChanges,
      lastSaved,
      saving,
      updateStickerLocal,
      markMissingAsOwned,
      unmarkUnlockedOwned,
      clearAllSavedOwned,
      saveStickersByCodes,
      saveToCloud,
      deleteSavedSticker,
      isStickerLocked,
      refresh,
    }),
    [
      loading,
      error,
      stickers,
      savedStickers,
      pendingChanges,
      lastSaved,
      saving,
      updateStickerLocal,
      markMissingAsOwned,
      unmarkUnlockedOwned,
      clearAllSavedOwned,
      saveStickersByCodes,
      saveToCloud,
      deleteSavedSticker,
      isStickerLocked,
      refresh,
    ],
  )
}
