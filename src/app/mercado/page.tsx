import { auth } from '@/auth'
import { MarketView } from '@/components/market/market-view'
import { PRODUCT_NAME } from '@/lib/brand'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Mercado de figuritas | ${PRODUCT_NAME}`,
  description:
    'Explora el catálogo de figuritas disponibles para canje presencial en Play Bar · Refugio Gastronómico. Filtra por selección o código.',
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
