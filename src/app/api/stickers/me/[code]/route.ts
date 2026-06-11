import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteSavedSticker, getUserSavedStickerMap } from '@/lib/stickers/service'
import { normalizeStickerCode } from '@/lib/domain/sticker-rules'
import { STANDARD_CODE_SET } from '@/lib/domain/catalog'

type RouteContext = {
  params: Promise<{ code: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { code } = await context.params
  const normalizedCode = normalizeStickerCode(code)

  if (!normalizedCode || !STANDARD_CODE_SET.has(normalizedCode)) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const saved = await getUserSavedStickerMap(session.user.id)
  if (!saved[normalizedCode]?.owned) {
    return NextResponse.json({ error: 'La figurita no está guardada' }, { status: 400 })
  }

  await deleteSavedSticker(session.user.id, normalizedCode)
  const updated = await getUserSavedStickerMap(session.user.id)

  return NextResponse.json({ saved: updated })
}
