import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Import compiled catalog via dynamic eval of TS exports is heavy; parse statically + compute FWC
const catalogPath = resolve(import.meta.dirname, '../src/lib/domain/catalog.ts')
const source = readFileSync(catalogPath, 'utf8')

function extractTeams() {
  const match = source.match(/export const teams = \[([\s\S]*?)\] as const/)
  if (!match) throw new Error('Could not parse teams')
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

function extractCustomCounts() {
  const match = source.match(/stickerCountByTeam[\s\S]*?\{([\s\S]*?)\}/)
  const counts = {}
  if (match) {
    for (const m of match[1].matchAll(/(\w+):\s*(\d+)/g)) counts[m[1]] = Number(m[2])
  }
  return counts
}

const teams = extractTeams()
const customCounts = extractCustomCounts()
const getCount = (team) => customCounts[team] ?? 20

// 00 + FWC1..FWC19 (matches catalog.ts)
const specials = ['00', ...Array.from({ length: 19 }, (_, i) => `FWC${i + 1}`)]

const nationalTeams = teams.filter((t) => t !== 'CC')
const nationalStickers = nationalTeams.reduce((sum, team) => sum + getCount(team), 0)
const ccStickers = getCount('CC')
const officialTotal = specials.length + nationalStickers
const appTotal = officialTotal + ccStickers

// All 48 nations confirmed in Cartophilic + Panini official (alphabetical checklist)
const OFFICIAL_48 = [
  'ALG', 'ARG', 'AUS', 'AUT', 'BEL', 'BIH', 'BRA', 'CAN', 'CIV', 'COL', 'CPV', 'CRO',
  'CUW', 'CZE', 'ECU', 'EGY', 'ENG', 'ESP', 'FRA', 'GER', 'GHA', 'HAI', 'IRN', 'IRQ',
  'JOR', 'JPN', 'KOR', 'KSA', 'MAR', 'MEX', 'NED', 'NOR', 'NZL', 'PAN', 'PAR', 'POR',
  'QAT', 'RSA', 'SCO', 'SEN', 'SUI', 'SWE', 'TUN', 'TUR', 'URU', 'USA', 'UZB', 'COD',
].sort()

// Physical album page order (hosts/seeds first within each group) — paniniwm2026.com + album layout
const ALBUM_PAGE_ORDER = [
  'MEX', 'RSA', 'KOR', 'CZE',
  'CAN', 'BIH', 'QAT', 'SUI',
  'BRA', 'MAR', 'HAI', 'SCO',
  'USA', 'PAR', 'AUS', 'TUR',
  'GER', 'CUW', 'CIV', 'ECU',
  'NED', 'JPN', 'SWE', 'TUN',
  'BEL', 'EGY', 'IRN', 'NZL',
  'ESP', 'CPV', 'KSA', 'URU',
  'FRA', 'SEN', 'IRQ', 'NOR',
  'ARG', 'ALG', 'AUT', 'JOR',
  'POR', 'COD', 'UZB', 'COL',
  'ENG', 'CRO', 'GHA', 'PAN',
]

const missingFromCatalog = OFFICIAL_48.filter((code) => !nationalTeams.includes(code))
const extraInCatalog = nationalTeams.filter((code) => !OFFICIAL_48.includes(code))
const wrongNationalCounts = nationalTeams
  .filter((code) => getCount(code) !== 20)
  .map((code) => ({ code, count: getCount(code) }))

const catalogNationalSorted = [...nationalTeams].sort()
const officialSorted = [...OFFICIAL_48].sort()
const teamsSetOk =
  missingFromCatalog.length === 0 &&
  extraInCatalog.length === 0 &&
  JSON.stringify(catalogNationalSorted) === JSON.stringify(officialSorted)

const orderMatchesAlbum = JSON.stringify(nationalTeams) === JSON.stringify(ALBUM_PAGE_ORDER)

let exitCode = 0
const issues = []

console.log('=== Panini 2026 — Verificación de catálogo ===\n')

console.log('Totales:')
console.log(`  Especiales (00 + FWC1-19): ${specials.length}  → oficial: 20`)
console.log(`  Selecciones nacionales:    ${nationalTeams.length}  → oficial: 48`)
console.log(`  Figuritas por selección:   20`)
console.log(`  Set oficial base:          ${officialTotal}  → oficial: 980`)
console.log(`  Promo Coca-Cola (CC):      ${ccStickers}  → NO forma parte del 980`)
console.log(`  Total en la app:           ${appTotal}  (980 + promo CC)`)

if (officialTotal !== 980) {
  issues.push(`Total oficial ${officialTotal} ≠ 980`)
  exitCode = 1
} else {
  console.log('\n✅ Conteo oficial 980: OK')
}

if (teamsSetOk) {
  console.log('✅ 48 selecciones y códigos ISO de 3 letras: OK')
} else {
  console.log('❌ Selecciones: discrepancias')
  if (missingFromCatalog.length) console.log('   Faltan:', missingFromCatalog.join(', '))
  if (extraInCatalog.length) console.log('   Sobran:', extraInCatalog.join(', '))
  exitCode = 1
}

if (wrongNationalCounts.length === 0) {
  console.log('✅ 20 figuritas por selección nacional: OK')
} else {
  console.log('❌ Conteos por selección:', wrongNationalCounts)
  exitCode = 1
}

if (orderMatchesAlbum) {
  console.log('✅ Orden de páginas del álbum físico (grupos A–L): OK')
} else {
  console.log('⚠️  Orden de páginas: difiere del álbum físico de referencia')
  for (let i = 0; i < ALBUM_PAGE_ORDER.length; i += 1) {
    if (nationalTeams[i] !== ALBUM_PAGE_ORDER[i]) {
      console.log(`   #${i + 1}: catálogo=${nationalTeams[i]} vs álbum=${ALBUM_PAGE_ORDER[i]}`)
    }
  }
}

if (teams.includes('CC')) {
  console.log('\n⚠️  CC (Coca-Cola) está en el catálogo estándar:')
  console.log('   - Infla el % de completitud (994 vs 980 oficial)')
  console.log('   - Es promo regional variable; no está en paninigroup.com')
  console.log('   - Recomendación: excluir CC del % oficial o mover a Extras')
}

if (issues.length) {
  console.log('\n❌ Issues:', issues.join('; '))
} else if (exitCode === 0) {
  console.log('\n✅ Catálogo base alineado con fuentes oficiales Panini 2026')
}

process.exit(exitCode)
