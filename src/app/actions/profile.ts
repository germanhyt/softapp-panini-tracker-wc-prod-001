'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { getHomeRouteForUser } from '@/lib/auth/home-route'
import { normalizePeruPhone, parseBirthDateInput } from '@/lib/auth/profile-fields'
import { isAdminEmail, isProfileComplete } from '@/lib/auth/users'
import { APP_COUNTRY_CODE, isAppCountryCode } from '@/lib/domain/countries'

export type CompleteProfileState = {
  error?: string
  success?: boolean
}

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  if (!('digest' in error)) return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}

export async function completeProfileAction(
  _prev: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Debes iniciar sesión' }
    }

    const name = String(formData.get('name') || '').trim()
    const surname = String(formData.get('surname') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    const birthDate = String(formData.get('birthDate') || '').trim()
    const countryCode = String(formData.get('countryCode') || '').trim()

    if (!name || !surname) {
      return { error: 'Completa nombre y apellido' }
    }

    const normalizedPhone = normalizePeruPhone(phone)
    if (!normalizedPhone) {
      return { error: 'Ingresa un celular válido de Perú con prefijo +51 (ejemplo: +51 912345678)' }
    }

    const parsedBirthDate = parseBirthDateInput(birthDate)
    if (!parsedBirthDate) {
      return { error: 'Ingresa una fecha de nacimiento válida' }
    }

    const resolvedCountry = countryCode || APP_COUNTRY_CODE

    if (!isAppCountryCode(resolvedCountry)) {
      return { error: 'Esta aplicación está disponible solo para coleccionistas en Perú' }
    }

    const country = await prisma.country.findUnique({ where: { code: APP_COUNTRY_CODE } })
    if (!country) {
      return { error: 'País no válido' }
    }

    const email = session.user.email || ''
    const admin = isAdminEmail(email)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: `${name} ${surname}`.trim(),
        emailVerified: session.user.emailVerified ? undefined : new Date(),
        lastLoginAt: new Date(),
      },
    })

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        name,
        surname,
        phone: normalizedPhone,
        birthDate: parsedBirthDate,
        countryCode: APP_COUNTRY_CODE,
        isAdmin: admin,
        profileCompletedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        name,
        surname,
        phone: normalizedPhone,
        birthDate: parsedBirthDate,
        countryCode: APP_COUNTRY_CODE,
        isAdmin: admin,
        profileCompletedAt: new Date(),
        provider: 'google',
      },
    })

    const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
    if (!isProfileComplete(profile)) {
      return { error: 'No se pudo completar el perfil' }
    }

    revalidatePath('/mercado')
    revalidatePath('/dashboard')
    revalidatePath('/complete-profile')

    redirect(getHomeRouteForUser(admin))
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }
    console.error('completeProfileAction failed:', error)
    return { error: 'No se pudo guardar el perfil. Intenta nuevamente.' }
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
