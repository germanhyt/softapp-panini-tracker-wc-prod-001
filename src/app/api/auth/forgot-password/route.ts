import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
  shouldExposeDevResetLink,
} from '@/lib/auth/password-reset'
import { buildRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { normalizeEmail } from '@/lib/auth/users'
import { getClientIp } from '@/lib/http/client-ip'
import { logError } from '@/lib/observability/logger'

const schema = z.object({
  email: z.string().email('Correo inválido'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Correo inválido' },
        { status: 400 },
      )
    }

    const email = normalizeEmail(parsed.data.email)

    const ipLimit = checkRateLimit({
      key: buildRateLimitKey('forgot-password:ip', [ip]),
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec)

    const emailLimit = checkRateLimit({
      key: buildRateLimitKey('forgot-password:email', [email]),
      limit: 3,
      windowMs: 15 * 60 * 1000,
    })
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSec)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })

    let devResetUrl: string | undefined

    if (user?.passwordHash) {
      const token = await createPasswordResetToken(email)
      const resetUrl = await sendPasswordResetEmail(email, token)
      if (shouldExposeDevResetLink()) {
        devResetUrl = resetUrl
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      ...(devResetUrl ? { devResetUrl } : {}),
    })
  } catch (error) {
    logError('auth.forgot-password', error, { ip })
    return NextResponse.json({ error: 'No se pudo procesar la solicitud' }, { status: 500 })
  }
}
