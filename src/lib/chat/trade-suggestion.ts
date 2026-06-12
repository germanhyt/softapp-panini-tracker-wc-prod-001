import { prisma } from '@/lib/db/prisma'
import { sortCodesByAlbumOrder } from '@/lib/domain/match-engine'

export type TradeListingItem = {
  code: string
  quantity: number
}

export type ChatTradeSuggestion = {
  iOfferTheyWant: TradeListingItem[]
  theyOfferIWant: TradeListingItem[]
  exchangeCount: number
  hasMyPublications: boolean
  hasTheirPublications: boolean
}

type ListingRow = {
  stickerCode: string
  listingType: string
  quantity: number
}

async function getActiveListingsForUser(userId: string): Promise<ListingRow[]> {
  return prisma.marketListing.findMany({
    where: {
      userId,
      isActive: true,
      user: {
        emailVerified: { not: null },
        profile: {
          showInMarket: true,
          profileCompletedAt: { not: null },
        },
      },
    },
    select: {
      stickerCode: true,
      listingType: true,
      quantity: true,
    },
  })
}

function toCodeSet(rows: ListingRow[], type: 'offer' | 'want'): Set<string> {
  return new Set(rows.filter((row) => row.listingType === type).map((row) => row.stickerCode))
}

function crossMatch(offers: ListingRow[], wants: Set<string>): TradeListingItem[] {
  const matched = offers
    .filter((row) => row.listingType === 'offer' && wants.has(row.stickerCode))
    .map((row) => ({
      code: row.stickerCode,
      quantity: row.quantity,
    }))

  return sortCodesByAlbumOrder(matched.map((item) => item.code)).map((code) => {
    const item = matched.find((entry) => entry.code === code)!
    return item
  })
}

export async function getChatTradeSuggestion(
  viewerUserId: string,
  otherUserId: string,
): Promise<ChatTradeSuggestion> {
  const [myListings, theirListings] = await Promise.all([
    getActiveListingsForUser(viewerUserId),
    getActiveListingsForUser(otherUserId),
  ])

  const myWants = toCodeSet(myListings, 'want')
  const theirWants = toCodeSet(theirListings, 'want')

  const iOfferTheyWant = crossMatch(myListings, theirWants)
  const theyOfferIWant = crossMatch(theirListings, myWants)

  return {
    iOfferTheyWant,
    theyOfferIWant,
    exchangeCount: Math.min(iOfferTheyWant.length, theyOfferIWant.length),
    hasMyPublications: myListings.length > 0,
    hasTheirPublications: theirListings.length > 0,
  }
}

function formatListingLine(items: TradeListingItem[]): string {
  if (items.length === 0) return '—'
  return items.map((item) => (item.quantity > 1 ? `${item.code} (x${item.quantity})` : item.code)).join(', ')
}

export function buildTradeSuggestionMessage(input: {
  otherUserName: string
  suggestion: ChatTradeSuggestion
}): string {
  const { suggestion, otherUserName } = input

  return `Hola ${otherUserName}, propongo este trueque según lo que cada uno tiene publicado en el mercado:

🎯 Yo te ofrezco: ${formatListingLine(suggestion.iOfferTheyWant)}
🎁 Tú me ofreces: ${formatListingLine(suggestion.theyOfferIWant)}

¿Te parece coordinar por aquí?`
}
