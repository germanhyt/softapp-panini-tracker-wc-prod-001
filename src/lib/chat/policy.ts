import { prisma } from '@/lib/db/prisma'

export class ChatPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatPolicyError'
  }
}

export async function getUserAdminFlag(userId: string): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { isAdmin: true },
  })
  return Boolean(profile?.isAdmin)
}

export async function getPrimaryCompanyUserId(): Promise<string | null> {
  const row = await prisma.userProfile.findFirst({
    where: {
      isAdmin: true,
      profileCompletedAt: { not: null },
      user: { emailVerified: { not: null } },
    },
    select: { userId: true },
    orderBy: { updatedAt: 'desc' },
  })
  return row?.userId ?? null
}

export async function assertDirectChatAllowed(initiatorUserId: string, targetUserId: string): Promise<void> {
  if (initiatorUserId === targetUserId) {
    throw new ChatPolicyError('No puedes iniciar un chat contigo mismo')
  }

  const [initiatorIsAdmin, targetIsAdmin] = await Promise.all([
    getUserAdminFlag(initiatorUserId),
    getUserAdminFlag(targetUserId),
  ])

  if (initiatorIsAdmin === targetIsAdmin) {
    throw new ChatPolicyError(
      initiatorIsAdmin
        ? 'El chat interno entre cuentas de empresa no está habilitado'
        : 'Solo puedes chatear con la cuenta oficial de Refugio Gastronómico',
    )
  }
}

export async function assertConversationAllowed(conversationId: string): Promise<void> {
  const participants = await prisma.chatParticipant.findMany({
    where: { conversationId },
    select: {
      userId: true,
      user: {
        select: {
          profile: {
            select: { isAdmin: true },
          },
        },
      },
    },
  })

  if (participants.length !== 2) return

  const adminCount = participants.filter((participant) => participant.user.profile?.isAdmin).length
  if (adminCount !== 1) {
    throw new ChatPolicyError('Esta conversación ya no está permitida')
  }
}
