import { MEETING_POINT } from '@/lib/brand'
import { allStickersOrdered } from '@/lib/domain/catalog'
import { normalizeStickerState, type StickerState } from '@/lib/domain/sticker-rules'

const ORDER_INDEX = new Map(allStickersOrdered.map((code, index) => [code, index]))

export function sortCodesByAlbumOrder(codes: string[] = []): string[] {
  return [...codes].sort((a, b) => {
    const indexA = ORDER_INDEX.has(a) ? ORDER_INDEX.get(a)! : Number.MAX_SAFE_INTEGER
    const indexB = ORDER_INDEX.has(b) ? ORDER_INDEX.get(b)! : Number.MAX_SAFE_INTEGER
    return indexA - indexB || a.localeCompare(b)
  })
}

export function getMissingCodes(saved: Record<string, StickerState>): string[] {
  return allStickersOrdered.filter((code) => !saved[code]?.owned)
}

export function getDuplicateCodes(saved: Record<string, StickerState>): string[] {
  return sortCodesByAlbumOrder(
    Object.entries(saved)
      .filter(([code, value]) => allStickersOrdered.includes(code) && Number(value?.duplicates || 0) > 0)
      .map(([code]) => code),
  )
}

export type ComputedMatch = {
  theyCanGiveMe: string[]
  iCanGiveThem: string[]
  myOffer: string[]
  myRequest: string[]
  exchangeCount: number
  score: number
}

export function computeMatch(
  myMissing: string[],
  myDuplicateCodes: string[],
  theirStickers: Record<string, StickerState>,
): ComputedMatch | null {
  const theyCanGiveMe = sortCodesByAlbumOrder(
    myMissing.filter((code) => Number(theirStickers[code]?.duplicates || 0) > 0),
  )

  const iCanGiveThem = sortCodesByAlbumOrder(
    myDuplicateCodes.filter((code) => !theirStickers[code]?.owned),
  )

  const exchangeCount = Math.min(theyCanGiveMe.length, iCanGiveThem.length)
  if (exchangeCount <= 0) return null

  const myOffer = iCanGiveThem.slice(0, exchangeCount)
  const myRequest = theyCanGiveMe.slice(0, exchangeCount)

  return {
    theyCanGiveMe,
    iCanGiveThem,
    myOffer,
    myRequest,
    exchangeCount,
    score:
      exchangeCount * 2 +
      Math.min(theyCanGiveMe.length, 20) * 0.1 +
      Math.min(iCanGiveThem.length, 20) * 0.1,
  }
}

export function compactStickerList(codes: string[] = [], limit = 8): string {
  const shown = codes.slice(0, limit).join(', ')
  const rest = codes.length > limit ? ` y ${codes.length - limit} más` : ''
  return `${shown}${rest}` || '—'
}

export function buildMatchEmailBody(input: {
  theirName: string
  myName: string
  myOffer: string[]
  myRequest: string[]
}): string {
  return `Hola ${input.theirName},

Un gusto, soy ${input.myName}. Vi que tenemos varias figuras del álbum Panini para intercambiar.

Yo tengo repetidas para ofrecerte:
${input.myOffer.join(', ')}

Y me gustaría intercambiar por estas figuras que tú tienes repetidas:
${input.myRequest.join(', ')}

Podemos coordinar por este correo si te parece bien.

Punto de encuentro sugerido: ${MEETING_POINT.label}
${MEETING_POINT.policyNote}

Saludos.`
}

export function stickersArrayToMap(
  rows: Array<{ stickerCode: string; owned: boolean; duplicates: number }>,
): Record<string, StickerState> {
  const map: Record<string, StickerState> = {}
  rows.forEach((row) => {
    map[row.stickerCode] = normalizeStickerState({
      owned: row.owned,
      duplicates: row.duplicates,
    })
  })
  return map
}
