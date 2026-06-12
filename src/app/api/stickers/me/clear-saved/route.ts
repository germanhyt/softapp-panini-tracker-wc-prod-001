import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { syncMarketListingsIfPublishing } from '@/lib/market/service'
import { clearSavedStickersBulk, getUserSavedStickerMap } from '@/lib/stickers/service'

const bodySchema = z.object({
  codes: z.array(z.string().min(1)).min(1),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const saved = await getUserSavedStickerMap(session.user.id)
    const clearedCodes = await clearSavedStickersBulk(session.user.id, parsed.data.codes, saved)

    if (clearedCodes.length === 0) {
      return NextResponse.json({ error: 'No hay figuritas guardadas para desmarcar' }, { status: 400 })
    }

    await syncMarketListingsIfPublishing(session.user.id, clearedCodes)
    const updated = await getUserSavedStickerMap(session.user.id)

    return NextResponse.json({ saved: updated, clearedCodes })
  } catch (error) {
    console.error('Clear saved stickers error:', error)
    return NextResponse.json({ error: 'No se pudieron desmarcar las figuritas guardadas' }, { status: 500 })
  }
}
