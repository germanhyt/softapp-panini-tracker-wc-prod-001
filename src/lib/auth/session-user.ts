import { prisma } from '@/lib/db/prisma'
import {
  buildDisplayName,
  isAdminEmail,
  isProfileComplete,
  normalizeEmail,
  splitDisplayName,
} from '@/lib/auth/users'

export type SessionUserPayload = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  profileComplete: boolean
  isAdmin: boolean
  countryCode: string | null
}

export async function loadSessionUser(userId: string): Promise<SessionUserPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!user?.email) return null

  const profileComplete = isProfileComplete(user.profile)

  return {
    id: user.id,
    email: user.email,
    displayName: buildDisplayName(user.profile?.name, user.profile?.surname, user.email),
    emailVerified: Boolean(user.emailVerified),
    profileComplete,
    isAdmin: Boolean(user.profile?.isAdmin),
    countryCode: user.profile?.countryCode ?? null,
  }
}

export async function ensureGoogleProfile(
  userId: string,
  email: string,
  displayName?: string | null,
  image?: string | null,
): Promise<void> {
  const { name, surname } = splitDisplayName(displayName || '')
  const admin = isAdminEmail(email)

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: displayName || undefined,
      image: image || undefined,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  })

  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      photoUrl: image || undefined,
      photoSource: image ? 'google' : 'none',
      provider: 'google',
      isAdmin: admin,
      updatedAt: new Date(),
    },
    create: {
      userId,
      name,
      surname,
      photoUrl: image || null,
      photoSource: image ? 'google' : 'none',
      provider: 'google',
      isAdmin: admin,
      profileCompletedAt: name && surname ? undefined : null,
    },
  })
}

export async function upsertEmailProfile(input: {
  userId: string
  email: string
  name: string
  surname: string
  countryCode: string
}): Promise<void> {
  const admin = isAdminEmail(input.email)

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      name: `${input.name} ${input.surname}`.trim(),
      lastLoginAt: new Date(),
    },
  })

  await prisma.userProfile.upsert({
    where: { userId: input.userId },
    update: {
      name: input.name,
      surname: input.surname,
      countryCode: input.countryCode,
      provider: 'password',
      isAdmin: admin,
      profileCompletedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      userId: input.userId,
      name: input.name,
      surname: input.surname,
      countryCode: input.countryCode,
      provider: 'password',
      isAdmin: admin,
      profileCompletedAt: new Date(),
    },
  })
}

export async function registerEmailUser(input: {
  name: string
  surname: string
  email: string
  passwordHash: string
  countryCode: string
}) {
  const email = normalizeEmail(input.email)

  return prisma.user.create({
    data: {
      email,
      passwordHash: input.passwordHash,
      name: `${input.name} ${input.surname}`.trim(),
      profile: {
        create: {
          name: input.name,
          surname: input.surname,
          countryCode: input.countryCode,
          provider: 'password',
          isAdmin: isAdminEmail(email),
          profileCompletedAt: new Date(),
        },
      },
    },
    include: { profile: true },
  })
}
