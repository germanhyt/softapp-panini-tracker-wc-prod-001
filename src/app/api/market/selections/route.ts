import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth/require-admin'
import {
  getMarketSelectionState,
  pruneInvalidMarketSelections,
  updateMarketSelections,
  type MarketSelectionPatch,
} from '@/lib/market/selection'
import { notifyMarketUpdated } from '@/lib/realtime/notify-market'
import { syncUserMarketListings } from '@/lib/market/service'

function parseSelectionPatch(body: unknown): MarketSelectionPatch | null {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  const patch: MarketSelectionPatch = {}

  if (typeof record.selectiveOffers === 'boolean') patch.selectiveOffers = record.selectiveOffers
  if (typeof record.selectiveWants === 'boolean') patch.selectiveWants = record.selectiveWants

  if (Array.isArray(record.offerCodes)) {
    patch.offerCodes = record.offerCodes.filter((code): code is string => typeof code === 'string')
  }

  if (Array.isArray(record.wantCodes)) {
    patch.wantCodes = record.wantCodes.filter((code): code is string => typeof code === 'string')
  }

  return Object.keys(patch).length > 0 ? patch : null
}

export async function GET() {
  const { session, error } = await requireAdminSession()
  if (error || !session?.user?.id) {
    return error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await pruneInvalidMarketSelections(session.user.id)
    const state = await getMarketSelectionState(session.user.id)
    return NextResponse.json(state)
  } catch (error) {
    console.error('Market selections load error:', error)
    return NextResponse.json({ error: 'No se pudieron cargar las selecciones' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAdminSession()
  if (error || !session?.user?.id) {
    return error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const patch = parseSelectionPatch(await request.json())
    if (!patch) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const state = await updateMarketSelections(session.user.id, patch)
    await syncUserMarketListings(session.user.id)
    await notifyMarketUpdated()

    return NextResponse.json(state)
  } catch (error) {
    console.error('Market selections update error:', error)
    return NextResponse.json({ error: 'No se pudieron guardar las selecciones' }, { status: 500 })
  }
}
