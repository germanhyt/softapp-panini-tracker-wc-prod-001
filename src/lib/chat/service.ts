import { prisma } from '@/lib/db/prisma'
import { buildPublicDisplayName } from '@/lib/market/service'
import {
  assertConversationAllowed,
  assertDirectChatAllowed,
  ChatPolicyError,
  getUserAdminFlag,
} from '@/lib/chat/policy'

export { ChatPolicyError, getPrimaryCompanyUserId } from '@/lib/chat/policy'

const MAX_MESSAGE_LENGTH = 2000
const DEFAULT_HISTORY_LIMIT = 50

export type ChatMessageItem = {
  id: string
  conversationId: string
  senderId: string
  body: string
  clientId: string | null
  createdAt: string
  isMine: boolean
}

export type ChatConversationPreview = {
  id: string
  otherUser: {
    id: string
    displayName: string
    photoUrl: string | null
  }
  lastMessage: {
    body: string
    createdAt: string
    senderId: string
    isMine: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

export type MarketChatPreview = {
  conversationId: string | null
  messages: ChatMessageItem[]
  isClosed: true
}

const MARKET_PREVIEW_LIMIT = 5

function normalizeMessageBody(body: string): string {
  return body.trim().slice(0, MAX_MESSAGE_LENGTH)
}

function mapParticipantPreview(input: {
  userId: string
  profile: { name: string; surname: string; photoUrl: string | null } | null
}) {
  return {
    id: input.userId,
    displayName: buildPublicDisplayName(input.profile?.name ?? '', input.profile?.surname ?? ''),
    photoUrl: input.profile?.photoUrl ?? null,
  }
}

export async function userCanAccessConversation(userId: string, conversationId: string): Promise<boolean> {
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { userId: true },
  })
  return Boolean(participant)
}

export async function findExistingDirectConversation(userId: string, otherUserId: string): Promise<string | null> {
  if (userId === otherUserId) return null

  const candidates = await prisma.chatConversation.findMany({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  })

  const existing = candidates.find((conversation) => conversation._count.participants === 2)
  return existing?.id ?? null
}

export async function findOrCreateDirectConversation(userId: string, otherUserId: string): Promise<string> {
  await assertDirectChatAllowed(userId, otherUserId)

  const otherUser = await prisma.user.findFirst({
    where: {
      id: otherUserId,
      emailVerified: { not: null },
      profile: {
        profileCompletedAt: { not: null },
      },
    },
    select: { id: true },
  })

  if (!otherUser) {
    throw new Error('Usuario no disponible para chat')
  }

  const existingId = await findExistingDirectConversation(userId, otherUserId)
  if (existingId) {
    return existingId
  }

  const created = await prisma.chatConversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    select: { id: true },
  })

  return created.id
}

export async function getMarketChatPreview(userId: string, otherUserId: string): Promise<MarketChatPreview> {
  try {
    await assertDirectChatAllowed(userId, otherUserId)
  } catch {
    return {
      conversationId: null,
      messages: [],
      isClosed: true,
    }
  }

  const conversationId = await findExistingDirectConversation(userId, otherUserId)
  if (!conversationId) {
    return {
      conversationId: null,
      messages: [],
      isClosed: true,
    }
  }

  const messages = await getConversationMessages(userId, conversationId, MARKET_PREVIEW_LIMIT)

  return {
    conversationId,
    messages,
    isClosed: true,
  }
}

export async function listConversationsForUser(userId: string): Promise<ChatConversationPreview[]> {
  const viewerIsAdmin = await getUserAdminFlag(userId)

  const rows = await prisma.chatParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      name: true,
                      surname: true,
                      photoUrl: true,
                      isAdmin: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              body: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      },
    },
    orderBy: {
      conversation: {
        lastMessageAt: 'desc',
      },
    },
  })

  const previews: ChatConversationPreview[] = []

  for (const row of rows) {
    const otherParticipant = row.conversation.participants.find((participant) => participant.userId !== userId)
    if (!otherParticipant) continue

    const otherIsAdmin = Boolean(otherParticipant.user.profile?.isAdmin)
    if (!viewerIsAdmin && !otherIsAdmin) continue

    const unreadCount = await prisma.chatMessage.count({
      where: {
        conversationId: row.conversationId,
        senderId: { not: userId },
        createdAt: row.lastReadAt ? { gt: row.lastReadAt } : undefined,
      },
    })

    const lastMessage = row.conversation.messages[0]

    previews.push({
      id: row.conversationId,
      otherUser: mapParticipantPreview({
        userId: otherParticipant.userId,
        profile: otherParticipant.user.profile,
      }),
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
            senderId: lastMessage.senderId,
            isMine: lastMessage.senderId === userId,
          }
        : null,
      unreadCount,
      updatedAt: (row.conversation.lastMessageAt ?? row.conversation.updatedAt).toISOString(),
    })
  }

  previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return previews
}

export async function getConversationMessages(
  userId: string,
  conversationId: string,
  limit = DEFAULT_HISTORY_LIMIT,
): Promise<ChatMessageItem[]> {
  const allowed = await userCanAccessConversation(userId, conversationId)
  if (!allowed) {
    throw new Error('Conversación no encontrada')
  }

  await assertConversationAllowed(conversationId)

  const rows = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      body: true,
      clientId: true,
      createdAt: true,
    },
  })

  return rows
    .reverse()
    .map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      body: row.body,
      clientId: row.clientId,
      createdAt: row.createdAt.toISOString(),
      isMine: row.senderId === userId,
    }))
}

export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  await prisma.chatParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  })
}

export async function sendChatMessage(input: {
  userId: string
  conversationId: string
  body: string
  clientId?: string | null
}): Promise<ChatMessageItem> {
  const body = normalizeMessageBody(input.body)
  if (!body) {
    throw new Error('El mensaje está vacío')
  }

  const allowed = await userCanAccessConversation(input.userId, input.conversationId)
  if (!allowed) {
    throw new Error('Conversación no encontrada')
  }

  await assertConversationAllowed(input.conversationId)

  const now = new Date()

  const message = await prisma.$transaction(async (tx) => {
    if (input.clientId) {
      const existing = await tx.chatMessage.findUnique({
        where: {
          conversationId_clientId: {
            conversationId: input.conversationId,
            clientId: input.clientId,
          },
        },
      })
      if (existing) {
        return existing
      }
    }

    const created = await tx.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.userId,
        body,
        clientId: input.clientId || null,
      },
    })

    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageAt: now,
        updatedAt: now,
      },
    })

    await tx.chatParticipant.updateMany({
      where: {
        conversationId: input.conversationId,
        userId: input.userId,
      },
      data: { lastReadAt: now },
    })

    return created
  })

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    clientId: message.clientId,
    createdAt: message.createdAt.toISOString(),
    isMine: true,
  }
}

export async function getTotalUnreadCount(userId: string): Promise<number> {
  const conversations = await listConversationsForUser(userId)
  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
}

export async function getConversationPeer(userId: string, conversationId: string) {
  const allowed = await userCanAccessConversation(userId, conversationId)
  if (!allowed) return null

  try {
    await assertConversationAllowed(conversationId)
  } catch {
    return null
  }

  const peer = await prisma.chatParticipant.findFirst({
    where: {
      conversationId,
      userId: { not: userId },
    },
    include: {
      user: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              surname: true,
              photoUrl: true,
            },
          },
        },
      },
    },
  })

  if (!peer) return null

  return {
    id: peer.userId,
    displayName: mapParticipantPreview({
      userId: peer.userId,
      profile: peer.user.profile,
    }).displayName,
  }
}

export function serializeChatMessage(message: {
  id: string
  conversationId: string
  senderId: string
  body: string
  clientId: string | null
  createdAt: Date
}, viewerId: string): ChatMessageItem {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    clientId: message.clientId,
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderId === viewerId,
  }
}
