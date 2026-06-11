export type StickerState = {
  owned: boolean
  duplicates: number
}

export function normalizeStickerState(value: Partial<StickerState> | null | undefined): StickerState {
  return {
    owned: Boolean(value?.owned),
    duplicates: Math.max(0, Number(value?.duplicates) || 0),
  }
}

export function stickersAreEqual(a: Partial<StickerState> = {}, b: Partial<StickerState> = {}): boolean {
  const left = normalizeStickerState(a)
  const right = normalizeStickerState(b)
  return left.owned === right.owned && left.duplicates === right.duplicates
}

export function applyStickerPatch(
  current: Partial<StickerState>,
  updates: Partial<StickerState>,
  options: { alreadySavedAsOwned?: boolean } = {},
): StickerState {
  const normalizedCurrent = normalizeStickerState(current)
  const safeUpdates = { ...updates }

  if (options.alreadySavedAsOwned && safeUpdates.owned === false) {
    safeUpdates.owned = true
  }

  const nextOwned = safeUpdates.owned ?? normalizedCurrent.owned
  if (!nextOwned) {
    safeUpdates.duplicates = 0
  }

  if (safeUpdates.duplicates !== undefined) {
    safeUpdates.duplicates = Math.max(0, Number(safeUpdates.duplicates) || 0)
  }

  return normalizeStickerState({
    ...normalizedCurrent,
    ...safeUpdates,
  })
}

export function normalizeStickerCode(code: string): string {
  return String(code || '').trim().toUpperCase()
}
