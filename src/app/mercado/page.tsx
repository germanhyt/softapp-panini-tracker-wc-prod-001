import { auth } from '@/auth'
import { MarketView } from '@/components/market/market-view'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mercado de figuritas | Panini 2026 Tracker',
  description:
    'Explora repetidas y faltantes publicadas por coleccionistas del álbum Panini Mundial 2026. Filtra por país, selección o código.',
}

export default async function MercadoPage() {
  const session = await auth()
  const isAuthenticated = Boolean(session?.user?.profileComplete)

  return (
    <>
      <MarketView isAuthenticated={isAuthenticated} />
    </>
  )
}
