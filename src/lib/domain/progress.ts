import {
  allStickersOrdered,
  getAllStickers,
  getTeamStickerCount,
  specials,
  teamNames,
  teams,
} from '@/lib/domain/catalog'
import { normalizeStickerState, type StickerState } from '@/lib/domain/sticker-rules'

export type StickerMap = Record<string, StickerState>

export type CollectionStats = {
  total: number
  owned: number
  missing: number
  duplicates: number
}

export type SectionProgress = {
  id: string
  title: string
  total: number
  codes: string[]
  owned: number
  missing: number
  duplicates: number
  percent: number
  progressClass: 'low' | 'medium' | 'high' | 'complete'
  albumTarget: string
}

function getProgressClass(percent: number): SectionProgress['progressClass'] {
  if (percent >= 100) return 'complete'
  if (percent >= 75) return 'high'
  if (percent >= 40) return 'medium'
  return 'low'
}

export function buildEmptyStickerMap(): StickerMap {
  const map: StickerMap = {}
  getAllStickers().forEach((sticker) => {
    map[sticker.code] = { owned: false, duplicates: 0 }
  })
  return map
}

export function mergeSavedStickers(saved: StickerMap = {}): StickerMap {
  const merged = buildEmptyStickerMap()
  Object.entries(saved).forEach(([code, value]) => {
    merged[code] = normalizeStickerState(value)
  })
  return merged
}

export function computeStats(saved: StickerMap): CollectionStats {
  const total = allStickersOrdered.length
  const owned = allStickersOrdered.filter((code) => saved[code]?.owned).length
  const duplicates = allStickersOrdered.reduce(
    (sum, code) => sum + (Number(saved[code]?.duplicates) || 0),
    0,
  )

  return {
    total,
    owned,
    missing: total - owned,
    duplicates,
  }
}

export function buildSectionProgress(saved: StickerMap): SectionProgress[] {
  const sections = [
    {
      id: 'specials',
      title: '🏆 Logo Panini & FWC Specials',
      total: specials.length,
      codes: specials,
      albumTarget: '/album?page=1',
    },
    ...teams.map((team, index) => {
      const total = getTeamStickerCount(team)
      return {
        id: team,
        title: teamNames[team] || team,
        total,
        codes: Array.from({ length: total }, (_, i) => `${team}${i + 1}`),
        albumTarget: `/album?page=${index + 2}`,
      }
    }),
  ]

  return sections.map((section) => {
    const owned = section.codes.reduce(
      (count, code) => count + (normalizeStickerState(saved[code]).owned ? 1 : 0),
      0,
    )
    const duplicates = section.codes.reduce(
      (count, code) => count + normalizeStickerState(saved[code]).duplicates,
      0,
    )
    const missing = Math.max(section.total - owned, 0)
    const percent = section.total > 0 ? Math.round((owned / section.total) * 100) : 0

    return {
      ...section,
      owned,
      missing,
      duplicates,
      percent,
      progressClass: getProgressClass(percent),
    }
  })
}
