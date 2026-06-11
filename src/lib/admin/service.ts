import { prisma } from '@/lib/db/prisma'
import { allStickersOrdered } from '@/lib/domain/catalog'
import { getCountryName } from '@/lib/domain/countries'
import { normalizeStickerState, type StickerState } from '@/lib/domain/sticker-rules'

export type AdminUserStats = {
  owned: number
  duplicates: number
  missing: number
  total: number
  percent: number
}

export type AdminUserRow = {
  id: string
  email: string
  fullName: string
  provider: string
  countryName: string
  verified: boolean
  photoUrl: string | null
  createdAt: string | null
  lastLoginAt: string | null
  updatedAt: string | null
  stats: AdminUserStats
}

export type AdminSummary = {
  totalUsers: number
  verified: number
  google: number
  password: number
  withPhoto: number
  totalOwned: number
  totalDuplicates: number
  avgProgress: number
}

function getProviderLabel(provider = ''): string {
  if (provider.includes('google')) return 'Google'
  if (provider.includes('password')) return 'Correo'
  return provider || '—'
}

function computeUserStats(stickers: Record<string, StickerState>): AdminUserStats {
  let owned = 0
  let duplicates = 0

  allStickersOrdered.forEach((code) => {
    const item = stickers[code]
    if (item?.owned) owned += 1
    duplicates += Number(item?.duplicates || 0)
  })

  const total = allStickersOrdered.length
  const missing = Math.max(total - owned, 0)
  const percent = total ? Math.round((owned / total) * 100) : 0

  return { owned, duplicates, missing, total, percent }
}

function stickersArrayToMap(
  rows: Array<{ stickerCode: string; owned: boolean; duplicates: number }>,
): Record<string, StickerState> {
  const map: Record<string, StickerState> = {}
  rows.forEach((row) => {
    map[row.stickerCode] = normalizeStickerState(row)
  })
  return map
}

export function buildAdminSummary(users: AdminUserRow[]): AdminSummary {
  const totalUsers = users.length
  const verified = users.filter((item) => item.verified).length
  const google = users.filter((item) => item.provider === 'Google').length
  const password = users.filter((item) => item.provider === 'Correo').length
  const withPhoto = users.filter((item) => Boolean(item.photoUrl)).length
  const totalOwned = users.reduce((sum, item) => sum + item.stats.owned, 0)
  const totalDuplicates = users.reduce((sum, item) => sum + item.stats.duplicates, 0)
  const avgProgress = totalUsers
    ? Math.round(users.reduce((sum, item) => sum + item.stats.percent, 0) / totalUsers)
    : 0

  return { totalUsers, verified, google, password, withPhoto, totalOwned, totalDuplicates, avgProgress }
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      stickers: {
        select: {
          stickerCode: true,
          owned: true,
          duplicates: true,
        },
      },
    },
    orderBy: [{ lastLoginAt: 'desc' }, { createdAt: 'desc' }],
  })

  return users.map((user) => {
    const profile = user.profile
    const stickerMap = stickersArrayToMap(user.stickers)
    const stats = computeUserStats(stickerMap)

    return {
      id: user.id,
      email: user.email,
      fullName: profile ? `${profile.name} ${profile.surname}`.trim() || 'Usuario sin nombre' : 'Usuario sin nombre',
      provider: getProviderLabel(profile?.provider),
      countryName: profile?.countryCode ? getCountryName(profile.countryCode) || 'Sin país' : 'Sin país',
      verified: Boolean(user.emailVerified),
      photoUrl: profile?.photoUrl ?? null,
      createdAt: profile?.createdAt?.toISOString() ?? user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      updatedAt: profile?.updatedAt?.toISOString() ?? null,
      stats,
    }
  })
}
