import { prisma } from '@/lib/db/prisma'
import { STANDARD_CODE_SET, teams } from '@/lib/domain/catalog'
import { getCountryName } from '@/lib/domain/countries'
import { getDuplicateCodes, getMissingCodes } from '@/lib/domain/match-engine'
import { notifyMarketUpdated } from '@/lib/realtime/notify-market'
import { filterCodesBySelection, pruneInvalidMarketSelections } from '@/lib/market/selection'
import { getUserSavedStickerMap } from '@/lib/stickers/service'

export type ListingType = 'offer' | 'want'

export type MarketListingItem = {
  id: string
  listingType: ListingType
  stickerCode: string
  teamCode: string | null
  stickerType: string
  quantity: number
  updatedAt: string
  user: {
    displayName: string
    countryCode: string | null
    countryName: string
    photoUrl: string | null
    publisherUserId?: string
  }
}

export type MarketSearchParams = {
  page?: number
  limit?: number
  type?: ListingType | 'all'
  country?: string
  team?: string
  q?: string
}

export type MarketSearchResponse = {
  items: MarketListingItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type MarketUserSettings = {
  showInMarket: boolean
  publishOffers: boolean
  publishWants: boolean
  selectiveOffers: boolean
  selectiveWants: boolean
  offerCount: number
  wantCount: number
  lastSyncedAt: string | null
}

export type MarketSettingsPatch = {
  showInMarket?: boolean
  publishOffers?: boolean
  publishWants?: boolean
  selectiveOffers?: boolean
  selectiveWants?: boolean
}

const MAX_LIMIT = 48
const DEFAULT_LIMIT = 24

export function buildPublicDisplayName(name: string, surname: string): string {
  const first = name.trim()
  const lastInitial = surname.trim().slice(0, 1).toUpperCase()
  if (first && lastInitial) return `${first} ${lastInitial}.`
  if (first) return first
  return 'Coleccionista'
}

export async function getUserMarketSettings(userId: string): Promise<MarketUserSettings> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      showInMarket: true,
      publishOffers: true,
      publishWants: true,
      selectiveOffers: true,
      selectiveWants: true,
    },
  })

  const counts = await prisma.marketListing.groupBy({
    by: ['listingType'],
    where: { userId, isActive: true },
    _count: { _all: true },
  })

  const latest = await prisma.marketListing.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  })

  const offerCount = counts.find((row) => row.listingType === 'offer')?._count._all ?? 0
  const wantCount = counts.find((row) => row.listingType === 'want')?._count._all ?? 0

  return {
    showInMarket: profile?.showInMarket ?? false,
    publishOffers: profile?.publishOffers ?? false,
    publishWants: profile?.publishWants ?? false,
    selectiveOffers: profile?.selectiveOffers ?? false,
    selectiveWants: profile?.selectiveWants ?? false,
    offerCount,
    wantCount,
    lastSyncedAt: latest?.updatedAt.toISOString() ?? null,
  }
}

export async function updateMarketSettings(userId: string, patch: MarketSettingsPatch): Promise<void> {
  const current = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      showInMarket: true,
      publishOffers: true,
      publishWants: true,
      selectiveOffers: true,
      selectiveWants: true,
    },
  })

  if (!current) return

  const next = {
    showInMarket: patch.showInMarket ?? current.showInMarket,
    publishOffers: patch.publishOffers ?? current.publishOffers,
    publishWants: patch.publishWants ?? current.publishWants,
    selectiveOffers: patch.selectiveOffers ?? current.selectiveOffers,
    selectiveWants: patch.selectiveWants ?? current.selectiveWants,
  }

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.update({
      where: { userId },
      data: next,
    })

    if (patch.publishOffers === false) {
      await tx.marketListing.updateMany({
        where: { userId, listingType: 'offer', isActive: true },
        data: { isActive: false },
      })
    }

    if (patch.publishWants === false) {
      await tx.marketListing.updateMany({
        where: { userId, listingType: 'want', isActive: true },
        data: { isActive: false },
      })
    }
  })
}

export async function syncUserMarketListings(userId: string): Promise<{ offerCount: number; wantCount: number }> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      publishOffers: true,
      publishWants: true,
      selectiveOffers: true,
      selectiveWants: true,
    },
  })

  const publishOffers = profile?.publishOffers ?? false
  const publishWants = profile?.publishWants ?? false

  if (!publishOffers && !publishWants) {
    return { offerCount: 0, wantCount: 0 }
  }

  await pruneInvalidMarketSelections(userId)

  const saved = await getUserSavedStickerMap(userId)
  let duplicateCodes = publishOffers ? getDuplicateCodes(saved) : []
  let missingCodes = publishWants ? getMissingCodes(saved) : []

  if (publishOffers && profile?.selectiveOffers) {
    duplicateCodes = await filterCodesBySelection(userId, 'offer', duplicateCodes, true)
  }

  if (publishWants && profile?.selectiveWants) {
    missingCodes = await filterCodesBySelection(userId, 'want', missingCodes, true)
  }

  const now = new Date()

  const desiredOffers = duplicateCodes.map((code) => ({
    stickerCode: code,
    listingType: 'offer' as const,
    quantity: saved[code]?.duplicates ?? 1,
  }))

  const desiredWants = missingCodes.map((code) => ({
    stickerCode: code,
    listingType: 'want' as const,
    quantity: 1,
  }))

  const desiredItems = [...desiredOffers, ...desiredWants]
  const desiredKeys = new Set(desiredItems.map((item) => `${item.listingType}:${item.stickerCode}`))

  await prisma.$transaction(async (tx) => {
    for (const item of desiredItems) {
      await tx.marketListing.upsert({
        where: {
          userId_stickerCode_listingType: {
            userId,
            stickerCode: item.stickerCode,
            listingType: item.listingType,
          },
        },
        create: {
          userId,
          stickerCode: item.stickerCode,
          listingType: item.listingType,
          quantity: item.quantity,
          isActive: true,
          publishedAt: now,
        },
        update: {
          quantity: item.quantity,
          isActive: true,
          updatedAt: now,
        },
      })
    }

    const existing = await tx.marketListing.findMany({
      where: {
        userId,
        isActive: true,
        listingType: {
          in: [
            ...(publishOffers ? (['offer'] as const) : []),
            ...(publishWants ? (['want'] as const) : []),
          ],
        },
      },
      select: { id: true, listingType: true, stickerCode: true },
    })

    const staleIds = existing
      .filter((row) => !desiredKeys.has(`${row.listingType}:${row.stickerCode}`))
      .map((row) => row.id)

    if (staleIds.length > 0) {
      await tx.marketListing.updateMany({
        where: { id: { in: staleIds } },
        data: { isActive: false },
      })
    }

    if (!publishOffers) {
      await tx.marketListing.updateMany({
        where: { userId, listingType: 'offer', isActive: true },
        data: { isActive: false },
      })
    }

    if (!publishWants) {
      await tx.marketListing.updateMany({
        where: { userId, listingType: 'want', isActive: true },
        data: { isActive: false },
      })
    }
  })

  return {
    offerCount: desiredOffers.length,
    wantCount: desiredWants.length,
  }
}

/** Sincroniza listados y notifica por WebSocket si el usuario ya publica en el mercado. */
export async function syncMarketListingsIfPublishing(
  userId: string,
  changedCodes?: string[],
): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      publishOffers: true,
      publishWants: true,
    },
  })

  if (!profile?.publishOffers && !profile?.publishWants) {
    return false
  }

  if (changedCodes && changedCodes.length > 0) {
    const affectsMarket = changedCodes.some((code) => STANDARD_CODE_SET.has(code))
    if (!affectsMarket) {
      return false
    }
  }

  await syncUserMarketListings(userId)
  await notifyMarketUpdated()
  return true
}

export async function searchMarketListings(
  params: MarketSearchParams,
  viewerUserId?: string | null,
): Promise<MarketSearchResponse> {
  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT))
  const skip = (page - 1) * limit

  const listingType =
    params.type && params.type !== 'all' && (params.type === 'offer' || params.type === 'want')
      ? params.type
      : undefined

  const country = params.country?.trim().toUpperCase() || undefined
  const team = params.team?.trim().toUpperCase() || undefined
  const q = params.q?.trim().toUpperCase() || undefined

  if (team && !teams.includes(team as (typeof teams)[number])) {
    return {
      items: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    }
  }

  const where = {
    isActive: true,
    ...(listingType ? { listingType } : {}),
    ...(q
      ? {
          stickerCode: {
            contains: q,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    user: {
      emailVerified: { not: null },
      profile: {
        is: {
          showInMarket: true,
          profileCompletedAt: { not: null },
          ...(country ? { countryCode: country } : {}),
        },
      },
    },
    sticker: {
      ...(team ? { teamCode: team } : {}),
    },
  }

  const [rows, total] = await Promise.all([
    prisma.marketListing.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ updatedAt: 'desc' }, { stickerCode: 'asc' }],
      select: {
        id: true,
        listingType: true,
        stickerCode: true,
        quantity: true,
        updatedAt: true,
        sticker: {
          select: {
            teamCode: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                surname: true,
                countryCode: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.marketListing.count({ where }),
  ])

  const items: MarketListingItem[] = rows.map((row) => {
    const profile = row.user.profile
    const countryCode = profile?.countryCode ?? null

    return {
      id: row.id,
      listingType: row.listingType as ListingType,
      stickerCode: row.stickerCode,
      teamCode: row.sticker.teamCode,
      stickerType: row.sticker.type,
      quantity: row.quantity,
      updatedAt: row.updatedAt.toISOString(),
      user: {
        displayName: buildPublicDisplayName(profile?.name ?? '', profile?.surname ?? ''),
        countryCode,
        countryName: countryCode ? getCountryName(countryCode) : '',
        photoUrl: profile?.photoUrl ?? null,
        ...(viewerUserId && viewerUserId !== row.user.id
          ? { publisherUserId: row.user.id }
          : {}),
      },
    }
  })

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    },
  }
}
