import {
  getAlbumPageLabel,
  getTeamStickerCount,
  normalizeSearchText,
  specials,
  teamNames,
  teams,
} from '@/lib/domain/catalog'

export type AlbumPage = {
  id: string
  number: number
  albumLabel: string
  title: string
  subtitle: string
  team: string | null
  codes: string[]
}

export function padPage(num: number): string {
  return String(num).padStart(2, '0')
}

export function buildAlbumPages(): AlbumPage[] {
  const pages: AlbumPage[] = [
    {
      id: 'specials',
      number: 1,
      albumLabel: getAlbumPageLabel(null),
      title: '⭐ Logo Panini & FWC Specials',
      subtitle: '00 + FWC1 a FWC19',
      team: null,
      codes: specials,
    },
  ]

  teams.forEach((team, index) => {
    pages.push({
      id: team,
      number: index + 2,
      albumLabel: getAlbumPageLabel(team),
      title: teamNames[team] || team,
      subtitle: `${team}1 a ${team}${getTeamStickerCount(team)}`,
      team,
      codes: Array.from({ length: getTeamStickerCount(team) }, (_, i) => `${team}${i + 1}`),
    })
  })

  return pages
}

export function pageMatchesQuery(page: AlbumPage, query: string): boolean {
  if (!query) return true
  const normalized = normalizeSearchText(query)
  const cleanTitle = normalizeSearchText(page.title)
  const cleanSubtitle = normalizeSearchText(page.subtitle)

  return (
    normalizeSearchText(page.albumLabel || String(page.number).padStart(2, '0')).includes(normalized) ||
    normalizeSearchText(page.id).includes(normalized) ||
    cleanTitle.includes(normalized) ||
    cleanSubtitle.includes(normalized) ||
    page.codes.some((code) => normalizeSearchText(code).includes(normalized))
  )
}

export function filterCodesByQuery(page: AlbumPage, query: string): string[] {
  if (!query) return page.codes
  const normalized = normalizeSearchText(query)

  if (normalizeSearchText(page.id) === normalized || normalizeSearchText(page.title).includes(normalized)) {
    return page.codes
  }

  return page.codes.filter((code) => normalizeSearchText(code).includes(normalized))
}
