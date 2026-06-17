import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireAdminSession } from '@/lib/auth/require-admin'
import {
  getUserMarketSettings,
  searchMarketListings,
  syncUserMarketListings,
  type ListingType,
  type MarketSearchParams,
} from '@/lib/market/service'
import { notifyMarketUpdated } from '@/lib/realtime/notify-market'

function parseSearchParams(url: URL): MarketSearchParams {
  const page = Number(url.searchParams.get('page') || '1')
  const limit = Number(url.searchParams.get('limit') || '24')
  const typeParam = url.searchParams.get('type')
  const type =
    typeParam === 'offer' || typeParam === 'want' || typeParam === 'all'
      ? (typeParam as ListingType | 'all')
      : 'all'

  return {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 24,
    type,
    country: url.searchParams.get('country') || undefined,
    team: url.searchParams.get('team') || undefined,
    q: url.searchParams.get('q') || undefined,
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    const result = await searchMarketListings(parseSearchParams(new URL(request.url)), session?.user?.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Market search error:', error)
    return NextResponse.json({ error: 'No se pudo cargar el mercado' }, { status: 500 })
  }
}

export async function POST() {
  const { session, error } = await requireAdminSession()
  if (error || !session?.user?.id) {
    return error ?? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncUserMarketListings(session.user.id)
    const settings = await getUserMarketSettings(session.user.id)
    await notifyMarketUpdated()
    return NextResponse.json({
      success: true,
      ...result,
      settings,
    })
  } catch (error) {
    console.error('Market sync error:', error)
    return NextResponse.json({ error: 'No se pudo publicar en el mercado' }, { status: 500 })
  }
}
