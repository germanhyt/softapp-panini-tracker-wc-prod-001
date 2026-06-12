import { prisma } from '@/lib/db/prisma'
import { getDuplicateCodes, getMissingCodes } from '@/lib/domain/match-engine'
import { getUserSavedStickerMap } from '@/lib/stickers/service'
import type { ListingType } from '@/lib/market/service'

export type MarketSelectionItem = {
  code: string
  quantity: number
  selected: boolean
}

export type MarketSelectionState = {
  selectiveOffers: boolean
  selectiveWants: boolean
  offers: MarketSelectionItem[]
  wants: MarketSelectionItem[]
  selectedOfferCount: number
  selectedWantCount: number
}

export type MarketSelectionPatch = {
  selectiveOffers?: boolean
  selectiveWants?: boolean
  offerCodes?: string[]
  wantCodes?: string[]
}

async function getSelectedCodeSet(userId: string, listingType: ListingType): Promise<Set<string>> {
  const rows = await prisma.marketPublishSelection.findMany({
    where: { userId, listingType },
    select: { stickerCode: true },
  })
  return new Set(rows.map((row) => row.stickerCode))
}

export async function filterCodesBySelection(
  userId: string,
  listingType: ListingType,
  codes: string[],
  selective: boolean,
): Promise<string[]> {
  if (!selective) return codes

  const selected = await getSelectedCodeSet(userId, listingType)
  return codes.filter((code) => selected.has(code))
}

export async function getMarketSelectionState(userId: string): Promise<MarketSelectionState> {
  const [profile, saved, selectionRows] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        selectiveOffers: true,
        selectiveWants: true,
      },
    }),
    getUserSavedStickerMap(userId),
    prisma.marketPublishSelection.findMany({
      where: { userId },
      select: { stickerCode: true, listingType: true },
    }),
  ])

  const selectiveOffers = profile?.selectiveOffers ?? false
  const selectiveWants = profile?.selectiveWants ?? false

  const selectedOffers = new Set(
    selectionRows.filter((row) => row.listingType === 'offer').map((row) => row.stickerCode),
  )
  const selectedWants = new Set(
    selectionRows.filter((row) => row.listingType === 'want').map((row) => row.stickerCode),
  )

  const duplicateCodes = getDuplicateCodes(saved)
  const missingCodes = getMissingCodes(saved)

  const offers: MarketSelectionItem[] = duplicateCodes.map((code) => ({
    code,
    quantity: saved[code]?.duplicates ?? 1,
    selected: selectedOffers.has(code),
  }))

  const wants: MarketSelectionItem[] = missingCodes.map((code) => ({
    code,
    quantity: 1,
    selected: selectedWants.has(code),
  }))

  return {
    selectiveOffers,
    selectiveWants,
    offers,
    wants,
    selectedOfferCount: offers.filter((item) => item.selected).length,
    selectedWantCount: wants.filter((item) => item.selected).length,
  }
}

export async function updateMarketSelections(
  userId: string,
  patch: MarketSelectionPatch,
): Promise<MarketSelectionState> {
  const saved = await getUserSavedStickerMap(userId)
  const validOffers = new Set(getDuplicateCodes(saved))
  const validWants = new Set(getMissingCodes(saved))

  await prisma.$transaction(async (tx) => {
    if (patch.selectiveOffers !== undefined || patch.selectiveWants !== undefined) {
      await tx.userProfile.update({
        where: { userId },
        data: {
          ...(patch.selectiveOffers !== undefined ? { selectiveOffers: patch.selectiveOffers } : {}),
          ...(patch.selectiveWants !== undefined ? { selectiveWants: patch.selectiveWants } : {}),
        },
      })
    }

    if (patch.offerCodes) {
      const codes = [...new Set(patch.offerCodes.map((code) => code.trim().toUpperCase()))].filter((code) =>
        validOffers.has(code),
      )

      await tx.marketPublishSelection.deleteMany({
        where: { userId, listingType: 'offer' },
      })

      if (codes.length > 0) {
        await tx.marketPublishSelection.createMany({
          data: codes.map((stickerCode) => ({
            userId,
            stickerCode,
            listingType: 'offer',
          })),
          skipDuplicates: true,
        })
      }
    }

    if (patch.wantCodes) {
      const codes = [...new Set(patch.wantCodes.map((code) => code.trim().toUpperCase()))].filter((code) =>
        validWants.has(code),
      )

      await tx.marketPublishSelection.deleteMany({
        where: { userId, listingType: 'want' },
      })

      if (codes.length > 0) {
        await tx.marketPublishSelection.createMany({
          data: codes.map((stickerCode) => ({
            userId,
            stickerCode,
            listingType: 'want',
          })),
          skipDuplicates: true,
        })
      }
    }
  })

  return getMarketSelectionState(userId)
}

/** Elimina selecciones que ya no aplican (sin repetida o ya pegada). */
export async function pruneInvalidMarketSelections(userId: string): Promise<void> {
  const saved = await getUserSavedStickerMap(userId)
  const validOffers = new Set(getDuplicateCodes(saved))
  const validWants = new Set(getMissingCodes(saved))

  const rows = await prisma.marketPublishSelection.findMany({
    where: { userId },
    select: { userId: true, stickerCode: true, listingType: true },
  })

  const stale = rows.filter((row) => {
    if (row.listingType === 'offer') return !validOffers.has(row.stickerCode)
    if (row.listingType === 'want') return !validWants.has(row.stickerCode)
    return true
  })

  if (stale.length === 0) return

  await prisma.$transaction(
    stale.map((row) =>
      prisma.marketPublishSelection.delete({
        where: {
          userId_stickerCode_listingType: {
            userId: row.userId,
            stickerCode: row.stickerCode,
            listingType: row.listingType,
          },
        },
      }),
    ),
  )
}
