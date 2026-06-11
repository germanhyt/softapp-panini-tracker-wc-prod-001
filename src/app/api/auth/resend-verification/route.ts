import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import {
  createEmailVerificationToken,
  isDevVerificationExposed,
  sendVerificationEmail,
} from '@/lib/auth/email-verification'
import { buildRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { normalizeEmail } from '@/lib/auth/users'
import { getClientIp } from '@/lib/http/client-ip'
import { logError } from '@/lib/observability/logger'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }

    const email = normalizeEmail(parsed.data.email)

    const ipLimit = checkRateLimit({
      key: buildRateLimitKey('resend-verification:ip', [ip]),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec)

    const emailLimit = checkRateLimit({
      key: buildRateLimitKey('resend-verification:email', [email]),
      limit: 3,
      windowMs: 15 * 60 * 1000,
    })
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSec)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ ok: true })
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    const token = await createEmailVerificationToken(email)
    const verificationUrl = await sendVerificationEmail(email, token)

    return NextResponse.json({
      ok: true,
      ...(isDevVerificationExposed() ? { devVerificationUrl: verificationUrl } : {}),
    })
  } catch (error) {
    logError('auth.resend-verification', error, { ip })
    return NextResponse.json({ error: 'No se pudo reenviar el correo' }, { status: 500 })
  }
}
