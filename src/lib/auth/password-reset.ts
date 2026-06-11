import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getAppBaseUrl, logDevEmail, sendEmailWithResend } from '@/lib/email/resend'
import { isDevVerificationExposed } from '@/lib/auth/email-verification'

const TOKEN_TTL_HOURS = 1
const RESET_IDENTIFIER_PREFIX = 'password-reset:'

function resetIdentifier(email: string): string {
  return `${RESET_IDENTIFIER_PREFIX}${email}`
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.deleteMany({
    where: { identifier: resetIdentifier(email) },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: resetIdentifier(email),
      token,
      expires,
    },
  })

  return token
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || !record.identifier.startsWith(RESET_IDENTIFIER_PREFIX)) {
    return null
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined)
    return null
  }

  await prisma.verificationToken.delete({ where: { token } })
  return record.identifier.slice(RESET_IDENTIFIER_PREFIX.length)
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${token}`
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<string> {
  const url = buildPasswordResetUrl(token)
  const sent = await sendEmailWithResend({
    to: email,
    subject: 'Restablecer contraseña — Panini Tracker',
    html: `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Panini Tracker.</p>
      <p><a href="${url}">Crear nueva contraseña</a></p>
      <p>El enlace expira en ${TOKEN_TTL_HOURS} hora. Si no solicitaste esto, ignora este mensaje.</p>
    `,
  })

  if (!sent) {
    logDevEmail(email, 'Restablecer contraseña — Panini Tracker', url)
  }

  return url
}

export function shouldExposeDevResetLink(): boolean {
  return isDevVerificationExposed()
}
