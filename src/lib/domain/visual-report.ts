import { getTeamStickerCount, specials, teamNames, teams } from '@/lib/domain/catalog'
import { normalizeStickerState, type StickerState } from '@/lib/domain/sticker-rules'

const flagCodeByTeam: Record<string, string> = {
  MEX: 'mx',
  RSA: 'za',
  KOR: 'kr',
  CZE: 'cz',
  CAN: 'ca',
  BIH: 'ba',
  QAT: 'qa',
  SUI: 'ch',
  BRA: 'br',
  MAR: 'ma',
  HAI: 'ht',
  SCO: 'gb-sct',
  USA: 'us',
  PAR: 'py',
  AUS: 'au',
  TUR: 'tr',
  GER: 'de',
  CUW: 'cw',
  CIV: 'ci',
  ECU: 'ec',
  NED: 'nl',
  JPN: 'jp',
  SWE: 'se',
  TUN: 'tn',
  BEL: 'be',
  EGY: 'eg',
  IRN: 'ir',
  NZL: 'nz',
  ESP: 'es',
  CPV: 'cv',
  KSA: 'sa',
  URU: 'uy',
  FRA: 'fr',
  SEN: 'sn',
  IRQ: 'iq',
  NOR: 'no',
  ARG: 'ar',
  ALG: 'dz',
  AUT: 'at',
  JOR: 'jo',
  POR: 'pt',
  COD: 'cd',
  UZB: 'uz',
  COL: 'co',
  ENG: 'gb-eng',
  CRO: 'hr',
  GHA: 'gh',
  PAN: 'pa',
}

export type VisualLabelMeta =
  | { type: 'brand'; brand: 'fifa' | 'coca-cola'; text: string; code: string }
  | { type: 'flag'; flagCode?: string; code: string }

export type VisualReportCell = {
  code: string
  number: string
  owned: boolean
  duplicates: number
}

export type VisualReportRow = {
  id: string
  labelMeta: VisualLabelMeta
  fullName: string
  cells: VisualReportCell[]
  owned: number
  missing: number
}

export function buildLabelMeta(team: string | null): VisualLabelMeta {
  if (!team) {
    return { type: 'brand', brand: 'fifa', text: 'FIFA', code: 'FWC' }
  }

  if (team === 'CC') {
    return { type: 'brand', brand: 'coca-cola', text: 'Coca‑Cola', code: 'CC' }
  }

  return {
    type: 'flag',
    flagCode: flagCodeByTeam[team],
    code: team,
  }
}

export function buildVisualReportRows(saved: Record<string, StickerState>): VisualReportRow[] {
  const templateRows = [
    {
      id: 'fwc-specials',
      labelMeta: buildLabelMeta(null),
      fullName: 'FIFA World Cup Specials',
      cells: specials.map((code) => ({
        code,
        number: code === '00' ? '00' : code.replace('FWC', ''),
      })),
    },
    ...teams.map((team) => {
      const count = getTeamStickerCount(team)
      return {
        id: team,
        labelMeta: buildLabelMeta(team),
        fullName: teamNames[team] || team,
        cells: Array.from({ length: count }, (_, index) => ({
          code: `${team}${index + 1}`,
          number: String(index + 1),
        })),
      }
    }),
  ]

  return templateRows.map((row) => {
    const cells = row.cells.map((cell) => {
      const state = normalizeStickerState(saved[cell.code])
      return {
        ...cell,
        owned: state.owned,
        duplicates: state.duplicates,
      }
    })

    const owned = cells.filter((cell) => cell.owned).length

    return {
      ...row,
      cells,
      owned,
      missing: cells.length - owned,
    }
  })
}
