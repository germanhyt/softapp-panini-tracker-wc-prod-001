import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { syncMarketListingsIfPublishing } from '@/lib/market/service'
import {
  getUserSavedStickerMap,
  saveUserStickerPatches,
  validateStickerPatches,
} from '@/lib/stickers/service'

const patchSchema = z.object({
  patches: z.array(
    z.object({
      code: z.string().min(1),
      owned: z.boolean(),
      duplicates: z.number().int().min(0),
    }),
  ),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const saved = await getUserSavedStickerMap(session.user.id)
  return NextResponse.json({ saved })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const saved = await getUserSavedStickerMap(session.user.id)
    const validPatches = validateStickerPatches(parsed.data.patches, saved)

    if (validPatches.length === 0) {
      return NextResponse.json({ error: 'No hay figuritas válidas para guardar' }, { status: 400 })
    }

    await saveUserStickerPatches(session.user.id, validPatches)
    await syncMarketListingsIfPublishing(
      session.user.id,
      validPatches.map((patch) => patch.code),
    )

    const updated = await getUserSavedStickerMap(session.user.id)
    return NextResponse.json({ saved: updated })
  } catch (error) {
    console.error('Save stickers error:', error)
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  }
}
