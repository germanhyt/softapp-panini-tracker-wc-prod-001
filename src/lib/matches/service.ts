import { prisma } from '@/lib/db/prisma'
import { getUserSavedStickerMap } from '@/lib/stickers/service'
import { getDuplicateCodes, getMissingCodes } from '@/lib/domain/match-engine'

export type MatchUserPreview = {
  id: string
  name: string
  surname: string
  photoUrl: string | null
  email: string
}

export type MatchResult = {
  user: MatchUserPreview
  theyCanGiveMe: string[]
  iCanGiveThem: string[]
  myOffer: string[]
  myRequest: string[]
  exchangeCount: number
  score: number
}

export type MatchesResponse = {
  countryCode: string | null
  countryRequired: boolean
  mySummary: {
    duplicates: number
    missing: number
  }
  matches: MatchResult[]
}

export async function findMatchesForUser(userId: string): Promise<MatchesResponse> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { countryCode: true },
  })

  if (!profile?.countryCode) {
    return {
      countryCode: null,
      countryRequired: true,
      mySummary: { duplicates: 0, missing: 0 },
      matches: [],
    }
  }

  const mySaved = await getUserSavedStickerMap(userId)
  const myMissing = getMissingCodes(mySaved)
  const myDuplicateCodes = getDuplicateCodes(mySaved)

  return {
    countryCode: profile.countryCode,
    countryRequired: false,
    mySummary: {
      duplicates: myDuplicateCodes.length,
      missing: myMissing.length,
    },
    matches: [],
  }
}

export async function getRegisteredMemberCount(): Promise<number> {
  return prisma.user.count({
    where: {
      emailVerified: { not: null },
      profile: {
        is: {
          profileCompletedAt: { not: null },
        },
      },
    },
  })
}
