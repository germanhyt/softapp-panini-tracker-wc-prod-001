export type StickerType = 'logo' | 'special' | 'team' | 'collection' | 'extra'

export type CatalogSticker = {
  code: string
  team: string | null
  type: StickerType
}

export const teams = [
  'MEX', 'RSA', 'KOR', 'CZE', 'CAN', 'BIH', 'QAT', 'SUI', 'BRA', 'MAR', 'HAI', 'SCO',
  'USA', 'PAR', 'AUS', 'TUR', 'GER', 'CUW', 'CIV', 'ECU', 'NED', 'JPN', 'SWE', 'TUN',
  'BEL', 'EGY', 'IRN', 'NZL', 'ESP', 'CPV', 'KSA', 'URU', 'FRA', 'SEN', 'IRQ', 'NOR',
  'ARG', 'ALG', 'AUT', 'JOR', 'POR', 'COD', 'UZB', 'COL', 'ENG', 'CRO', 'GHA', 'PAN', 'CC',
] as const

export type TeamCode = (typeof teams)[number]

export const stickerCountByTeam: Partial<Record<TeamCode, number>> = {
  CC: 14,
}

export const getTeamStickerCount = (team: string): number =>
  stickerCountByTeam[team as TeamCode] ?? 20

export const specials = ['00', ...Array.from({ length: 19 }, (_, i) => `FWC${i + 1}`)]

export const teamNames: Record<string, string> = {
  MEX: '🇲🇽 Mexico (México)',
  RSA: '🇿🇦 South Africa (Sudáfrica)',
  KOR: '🇰🇷 Korea Republic (Corea del Sur)',
  CZE: '🇨🇿 Czechia (República Checa)',
  CAN: '🇨🇦 Canada (Canadá)',
  BIH: '🇧🇦 Bosnia',
  QAT: '🇶🇦 Qatar (Catar)',
  SUI: '🇨🇭 Switzerland (Suiza)',
  BRA: '🇧🇷 Brazil (Brasil)',
  MAR: '🇲🇦 Morocco (Marruecos)',
  HAI: '🇭🇹 Haiti (Haití)',
  SCO: '🏴 Scotland (Escocia)',
  USA: '🇺🇸 United States (Estados Unidos)',
  PAR: '🇵🇾 Paraguay',
  AUS: '🇦🇺 Australia',
  TUR: '🇹🇷 Türkiye (Turquía)',
  GER: '🇩🇪 Germany (Alemania)',
  CUW: '🇨🇼 Curaçao (Curazao)',
  CIV: '🇨🇮 Côte D\'Ivoire (Costa de Marfil)',
  ECU: '🇪🇨 Ecuador',
  NED: '🇳🇱 Netherlands (Países Bajos)',
  JPN: '🇯🇵 Japan (Japón)',
  SWE: '🇸🇪 Sweden (Suecia)',
  TUN: '🇹🇳 Tunisia (Túnez)',
  BEL: '🇧🇪 Belgium (Bélgica)',
  EGY: '🇪🇬 Egypt (Egipto)',
  IRN: '🇮🇷 IR Iran (Irán)',
  NZL: '🇳🇿 New Zealand (Nueva Zelanda)',
  ESP: '🇪🇸 Spain (España)',
  CPV: '🇨🇻 Cabo Verde',
  KSA: '🇸🇦 Saudi Arabia (Arabia Saudita)',
  URU: '🇺🇾 Uruguay',
  FRA: '🇫🇷 France (Francia)',
  SEN: '🇸🇳 Senegal',
  IRQ: '🇮🇶 Iraq (Irak)',
  NOR: '🇳🇴 Norway (Noruega)',
  ARG: '🇦🇷 Argentina',
  ALG: '🇩🇿 Algeria (Argelia)',
  AUT: '🇦🇹 Austria',
  JOR: '🇯🇴 Jordan (Jordania)',
  POR: '🇵🇹 Portugal',
  COD: '🇨🇩 DR Congo (RD Congo)',
  UZB: '🇺🇿 Uzbekistan (Uzbekistán)',
  COL: '🇨🇴 Colombia',
  ENG: '🏴 England (Inglaterra)',
  CRO: '🇭🇷 Croatia (Croacia)',
  GHA: '🇬🇭 Ghana',
  PAN: '🇵🇦 Panama (Panamá)',
  CC: '🎁 Coca-Cola',
}

export function getAlbumPageRange(team: string | null): { start: number; end: number } | { start: null; end: null } {
  if (!team) return { start: 0, end: 7 }

  const index = teams.indexOf(team as TeamCode)
  if (index < 0) return { start: null, end: null }

  const tunIndex = teams.indexOf('TUN')
  const blankSpreadOffset = index > tunIndex ? 2 : 0
  const start = 8 + index * 2 + blankSpreadOffset

  return { start, end: start + 1 }
}

export function getAlbumPageLabel(team: string | null): string {
  const range = getAlbumPageRange(team)
  if (range.start === null || range.end === null) return ''
  return `${String(range.start).padStart(2, '0')}-${String(range.end).padStart(2, '0')}`
}

export function normalizeSearchText(value = ''): string {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toUpperCase()
    .trim()
}

export function getAllStickers(): CatalogSticker[] {
  const stickers: CatalogSticker[] = []

  specials.forEach((code) => {
    stickers.push({
      code,
      team: null,
      type: code === '00' ? 'logo' : 'special',
    })
  })

  teams.forEach((team) => {
    const count = getTeamStickerCount(team)
    for (let i = 1; i <= count; i += 1) {
      stickers.push({
        code: `${team}${i}`,
        team,
        type: team === 'CC' ? 'collection' : 'team',
      })
    }
  })

  return stickers
}

export function getPageFromCode(code: string): {
  type: StickerType | 'extras'
  team: string | null
} {
  if (code === '00') return { type: 'logo', team: null }
  if (code.startsWith('FWC')) return { type: 'special', team: null }

  const match = code.match(/^([A-Z]{2,3})\d+$/)
  if (match && teams.includes(match[1] as TeamCode)) {
    const team = match[1]
    return { type: team === 'CC' ? 'collection' : 'team', team }
  }

  return { type: 'extras', team: null }
}

export const allStickersOrdered = getAllStickers().map((sticker) => sticker.code)

export const STANDARD_CODE_SET = new Set(allStickersOrdered)

export function buildCatalogSeedRows() {
  return getAllStickers().map((sticker, index) => ({
    code: sticker.code,
    teamCode: sticker.team,
    type: sticker.type,
    sortOrder: index,
    isStandard: true,
  }))
}
