import { prisma } from '@/lib/db/prisma'
import { STANDARD_CODE_SET } from '@/lib/domain/catalog'
import {
  applyStickerPatch,
  normalizeStickerCode,
  normalizeStickerState,
  type StickerState,
} from '@/lib/domain/sticker-rules'

const EXTRA_CODE_PATTERN = /^[A-Z0-9_-]{1,16}$/

async function ensureExtraStickerRows(codes: string[]): Promise<void> {
  const extras = Array.from(new Set(codes.filter((code) => !STANDARD_CODE_SET.has(code))))
  if (extras.length === 0) return

  await prisma.$transaction(
    extras.map((code) =>
      prisma.sticker.upsert({
        where: { code },
        create: {
          code,
          teamCode: null,
          type: 'extra',
          sortOrder: 1_000_000,
          isStandard: false,
        },
        update: {},
      }),
    ),
  )
}

export type StickerPatch = {
  code: string
  owned: boolean
  duplicates: number
}

export async function getUserSavedStickerMap(userId: string): Promise<Record<string, StickerState>> {
  const rows = await prisma.userSticker.findMany({
    where: { userId },
    select: {
      stickerCode: true,
      owned: true,
      duplicates: true,
    },
  })

  const map: Record<string, StickerState> = {}
  rows.forEach((row) => {
    map[row.stickerCode] = normalizeStickerState({
      owned: row.owned,
      duplicates: row.duplicates,
    })
  })

  return map
}

export async function saveUserStickerPatches(userId: string, patches: StickerPatch[]): Promise<void> {
  if (patches.length === 0) return

  const now = new Date()
  const codes = patches.map((patch) => normalizeStickerCode(patch.code)).filter(Boolean)
  await ensureExtraStickerRows(codes)

  await prisma.$transaction(
    patches.map((patch) => {
      const code = normalizeStickerCode(patch.code)
      const state = normalizeStickerState(patch)

      return prisma.userSticker.upsert({
        where: {
          userId_stickerCode: {
            userId,
            stickerCode: code,
          },
        },
        create: {
          userId,
          stickerCode: code,
          owned: state.owned,
          duplicates: state.duplicates,
          savedAt: now,
        },
        update: {
          owned: state.owned,
          duplicates: state.duplicates,
          savedAt: now,
        },
      })
    }),
  )
}

export async function deleteSavedSticker(userId: string, code: string): Promise<void> {
  const normalizedCode = normalizeStickerCode(code)
  if (!normalizedCode) return

  const now = new Date()
  await prisma.userSticker.upsert({
    where: {
      userId_stickerCode: {
        userId,
        stickerCode: normalizedCode,
      },
    },
    create: {
      userId,
      stickerCode: normalizedCode,
      owned: false,
      duplicates: 0,
      savedAt: now,
    },
    update: {
      owned: false,
      duplicates: 0,
      savedAt: now,
    },
  })
}

export async function clearSavedStickersBulk(
  userId: string,
  codes: string[],
  saved: Record<string, StickerState>,
): Promise<string[]> {
  const normalizedCodes = Array.from(
    new Set(
      codes
        .map((code) => normalizeStickerCode(code))
        .filter((code) => code && STANDARD_CODE_SET.has(code) && saved[code]?.owned),
    ),
  )

  if (normalizedCodes.length === 0) return []

  const now = new Date()
  await prisma.$transaction(
    normalizedCodes.map((code) =>
      prisma.userSticker.update({
        where: {
          userId_stickerCode: {
            userId,
            stickerCode: code,
          },
        },
        data: {
          owned: false,
          duplicates: 0,
          savedAt: now,
        },
      }),
    ),
  )

  return normalizedCodes
}

export function validateStickerPatches(
  patches: StickerPatch[],
  saved: Record<string, StickerState>,
): StickerPatch[] {
  return patches
    .map((patch) => {
      const code = normalizeStickerCode(patch.code)
      if (!code) return null

      const isStandard = STANDARD_CODE_SET.has(code)
      if (!isStandard && !EXTRA_CODE_PATTERN.test(code)) return null

      const current = saved[code] || { owned: false, duplicates: 0 }
      const next = applyStickerPatch(current, patch, {
        alreadySavedAsOwned: Boolean(saved[code]?.owned),
      })

      return { code, ...next }
    })
    .filter((patch): patch is StickerPatch => patch !== null)
}
