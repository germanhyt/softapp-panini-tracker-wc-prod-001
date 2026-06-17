import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { getUserMarketSettings, updateMarketSettings, type MarketSettingsPatch } from '@/lib/market/service'
import { notifyMarketUpdated } from '@/lib/realtime/notify-market'

function parseSettingsPatch(body: unknown): MarketSettingsPatch | null {
  if (!body || typeof body !== 'object') return null

  const patch: MarketSettingsPatch = {}
  const record = body as Record<string, unknown>

  if (typeof record.showInMarket === 'boolean') patch.showInMarket = record.showInMarket
  if (typeof record.publishOffers === 'boolean') patch.publishOffers = record.publishOffers
  if (typeof record.publishWants === 'boolean') patch.publishWants = record.publishWants
  if (typeof record.selectiveOffers === 'boolean') patch.selectiveOffers = record.selectiveOffers
  if (typeof record.selectiveWants === 'boolean') patch.selectiveWants = record.selectiveWants

  return Object.keys(patch).length > 0 ? patch : null
}

export async function GET() {
  const { session, error } = await requireAdminSession()
  if (error || !session?.user?.id) {
    return error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const settings = await getUserMarketSettings(session.user.id)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Market settings error:', error)
    return NextResponse.json({ error: 'No se pudieron cargar los ajustes' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAdminSession()
  if (error || !session?.user?.id) {
    return error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const patch = parseSettingsPatch(await request.json())
    if (!patch) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    await updateMarketSettings(session.user.id, patch)
    const settings = await getUserMarketSettings(session.user.id)
    await notifyMarketUpdated()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Market settings update error:', error)
    return NextResponse.json({ error: 'No se pudieron guardar los ajustes' }, { status: 500 })
  }
}
