import { prisma } from '@/lib/db/prisma'
import { getCountryName } from '@/lib/domain/countries'

export type AdminUserRow = {
  id: string
  email: string
  fullName: string
  phone: string | null
  provider: string
  countryName: string
  verified: boolean
  isAdmin: boolean
  photoUrl: string | null
  createdAt: string | null
  lastLoginAt: string | null
  updatedAt: string | null
}

export type AdminSummary = {
  totalUsers: number
  verified: number
  google: number
  password: number
  withPhoto: number
  admins: number
  pendingVerification: number
}

function getProviderLabel(provider = ''): string {
  if (provider.includes('google')) return 'Google'
  if (provider.includes('password')) return 'Correo'
  return provider || '—'
}

export function buildAdminSummary(users: AdminUserRow[]): AdminSummary {
  const totalUsers = users.length
  const verified = users.filter((item) => item.verified).length
  const google = users.filter((item) => item.provider === 'Google').length
  const password = users.filter((item) => item.provider === 'Correo').length
  const withPhoto = users.filter((item) => Boolean(item.photoUrl)).length
  const admins = users.filter((item) => item.isAdmin).length
  const pendingVerification = Math.max(totalUsers - verified, 0)

  return { totalUsers, verified, google, password, withPhoto, admins, pendingVerification }
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
    },
    orderBy: [{ lastLoginAt: 'desc' }, { createdAt: 'desc' }],
  })

  return users.map((user) => {
    const profile = user.profile

    return {
      id: user.id,
      email: user.email,
      fullName: profile ? `${profile.name} ${profile.surname}`.trim() || 'Usuario sin nombre' : 'Usuario sin nombre',
      phone: profile?.phone ?? null,
      provider: getProviderLabel(profile?.provider),
      countryName: profile?.countryCode ? getCountryName(profile.countryCode) || 'Sin país' : 'Sin país',
      verified: Boolean(user.emailVerified),
      isAdmin: Boolean(profile?.isAdmin),
      photoUrl: profile?.photoUrl ?? null,
      createdAt: profile?.createdAt?.toISOString() ?? user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      updatedAt: profile?.updatedAt?.toISOString() ?? null,
    }
  })
}
