import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import {
  createEmailVerificationToken,
  isDevVerificationExposed,
  sendVerificationEmail,
} from '@/lib/auth/email-verification'
import { buildRateLimitKey, checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit'
import { registerEmailUser } from '@/lib/auth/session-user'
import { normalizeEmail } from '@/lib/auth/users'
import { getClientIp } from '@/lib/http/client-ip'
import { logError } from '@/lib/observability/logger'
import { APP_COUNTRY_CODE, isAppCountryCode } from '@/lib/domain/countries'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido'),
  surname: z.string().trim().min(1, 'Apellido requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  countryCode: z.string().trim().min(2, 'País requerido'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)

  const ipLimit = checkRateLimit({
    key: buildRateLimitKey('register:ip', [ip]),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec)

  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 },
      )
    }

    const { name, surname, email, password, countryCode } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const emailLimit = checkRateLimit({
      key: buildRateLimitKey('register:email', [normalizedEmail]),
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSec)

    if (!isAppCountryCode(countryCode)) {
      return NextResponse.json(
        { error: 'Esta aplicación está disponible solo para coleccionistas en Perú' },
        { status: 400 },
      )
    }

    const country = await prisma.country.findUnique({ where: { code: APP_COUNTRY_CODE } })
    if (!country) {
      return NextResponse.json({ error: 'País no válido' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.' },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    await registerEmailUser({
      name,
      surname,
      email: normalizedEmail,
      passwordHash,
      countryCode: APP_COUNTRY_CODE,
    })

    const token = await createEmailVerificationToken(normalizedEmail)
    const verificationUrl = await sendVerificationEmail(normalizedEmail, token)

    return NextResponse.json({
      ok: true,
      email: normalizedEmail,
      ...(isDevVerificationExposed() ? { devVerificationUrl: verificationUrl } : {}),
    })
  } catch (error) {
    logError('auth.register', error, { ip })

    const isDev = process.env.NODE_ENV !== 'production'
    let message = 'No se pudo completar el registro'

    if (error instanceof Error) {
      if (error.message.includes('Environment variable not found: DATABASE_URL')) {
        message = 'Falta DATABASE_URL. Crea .env desde .env.example y configura PostgreSQL.'
      } else if (error.message.includes('Can\'t reach database') || error.message.includes('connect')) {
        message = 'No hay conexión a PostgreSQL. Verifica DATABASE_URL y que el servicio esté activo.'
      } else if (error.message.includes('does not exist') || error.message.includes('P2021')) {
        message = 'Las tablas no existen. Ejecuta: npm run db:migrate && npm run db:seed'
      } else if (isDev) {
        message = `Error de registro: ${error.message}`
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
