import { PrismaClient } from '@prisma/client'
import { COUNTRIES } from '../src/lib/domain/countries'
import { buildCatalogSeedRows } from '../src/lib/domain/catalog'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding countries...')
  for (const [index, country] of COUNTRIES.entries()) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, sortOrder: index },
      create: { code: country.code, name: country.name, sortOrder: index },
    })
  }

  console.log('Seeding sticker catalog...')
  const catalogRows = buildCatalogSeedRows()
  for (const row of catalogRows) {
    await prisma.sticker.upsert({
      where: { code: row.code },
      update: {
        teamCode: row.teamCode,
        type: row.type,
        sortOrder: row.sortOrder,
        isStandard: row.isStandard,
      },
      create: row,
    })
  }

  console.log(`Done: ${COUNTRIES.length} countries, ${catalogRows.length} stickers.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
