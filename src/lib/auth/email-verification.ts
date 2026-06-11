import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getAppBaseUrl, logDevEmail, sendEmailWithResend } from '@/lib/email/resend'

const TOKEN_TTL_HOURS = 24

export function isDevVerificationExposed(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.EXPOSE_DEV_VERIFICATION_LINK === 'true'
}

export async function createEmailVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || record.identifier.startsWith('password-reset:') || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined)
    }
    return null
  }

  await prisma.verificationToken.delete({ where: { token } })
  return record.identifier
}

export function buildVerificationUrl(token: string): string {
  return `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`
}

export async function sendVerificationEmail(email: string, token: string): Promise<string> {
  const url = buildVerificationUrl(token)
  const sent = await sendEmailWithResend({
    to: email,
    subject: 'Verifica tu correo — Panini Tracker',
    html: `
      <p>Hola,</p>
      <p>Confirma tu correo para usar el tracker de figuritas Panini 2026:</p>
      <p><a href="${url}">Verificar mi correo</a></p>
      <p>Si no creaste esta cuenta, ignora este mensaje.</p>
    `,
  })

  if (!sent) {
    logDevEmail(email, 'Verifica tu correo — Panini Tracker', url)
  }

  return url
}
