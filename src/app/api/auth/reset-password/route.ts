import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { consumePasswordResetToken } from '@/lib/auth/password-reset'
import { hashPassword } from '@/lib/auth/password'
import { buildRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { logError } from '@/lib/observability/logger'

const schema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)

  const ipLimit = checkRateLimit({
    key: buildRateLimitKey('reset-password:ip', [ip]),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec)

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 },
      )
    }

    const email = await consumePasswordResetToken(parsed.data.token)
    if (!email) {
      return NextResponse.json(
        { error: 'El enlace no es válido o ya expiró. Solicita uno nuevo.' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Esta cuenta usa Google. Inicia sesión con Google.' },
        { status: 400 },
      )
    }

    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logError('auth.reset-password', error, { ip })
    return NextResponse.json({ error: 'No se pudo restablecer la contraseña' }, { status: 500 })
  }
}
