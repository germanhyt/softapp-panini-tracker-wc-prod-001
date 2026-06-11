import { getPageFromCode, teamNames } from '@/lib/domain/catalog'
import { getDuplicateCodes, getMissingCodes } from '@/lib/domain/match-engine'
import { computeStats, type StickerMap } from '@/lib/domain/progress'

export type TradeDuplicateItem = {
  code: string
  owned: boolean
  duplicates: number
}

function getGroupLabel(code: string): string {
  const page = getPageFromCode(code)
  if (page.type === 'team' || page.type === 'collection') return teamNames[page.team || ''] || page.team || 'Selección'
  if (page.type === 'special') return 'Especiales FWC'
  if (page.type === 'logo') return 'Logo Panini'
  return 'Extras'
}

function compactGroupName(label = ''): string {
  return label.replace(/^\p{Emoji_Presentation}\s*/u, '').trim()
}

export function groupCodesBySection<T>(items: T[], getCode: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const label = compactGroupName(getGroupLabel(getCode(item)))
    if (!acc[label]) acc[label] = []
    acc[label].push(item)
    return acc
  }, {})
}

export function buildTradeReportData(saved: StickerMap) {
  const stats = computeStats(saved)
  const missing = getMissingCodes(saved)
  const duplicated: TradeDuplicateItem[] = getDuplicateCodes(saved).map((code) => ({
    code,
    owned: true,
    duplicates: saved[code]?.duplicates || 0,
  }))

  return {
    stats,
    percent: stats.total ? Math.round((stats.owned / stats.total) * 100) : 0,
    duplicated,
    missing,
    duplicatedGroups: groupCodesBySection(duplicated, (item) => item.code),
    missingGroups: groupCodesBySection(missing, (code) => code),
  }
}
