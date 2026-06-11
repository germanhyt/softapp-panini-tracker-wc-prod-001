'use server'

import { revalidatePath } from 'next/cache'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { isAdminEmail, isProfileComplete } from '@/lib/auth/users'

export type CompleteProfileState = {
  error?: string
  success?: boolean
}

export async function completeProfileAction(
  _prev: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Debes iniciar sesión' }
  }

  const name = String(formData.get('name') || '').trim()
  const surname = String(formData.get('surname') || '').trim()
  const countryCode = String(formData.get('countryCode') || '').trim()

  if (!name || !surname) {
    return { error: 'Completa nombre y apellido' }
  }

  if (!countryCode) {
    return { error: 'Selecciona tu país para habilitar matches' }
  }

  const country = await prisma.country.findUnique({ where: { code: countryCode } })
  if (!country) {
    return { error: 'País no válido' }
  }

  const email = session.user.email || ''
  const admin = isAdminEmail(email)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: `${name} ${surname}`.trim(),
      lastLoginAt: new Date(),
    },
  })

  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {
      name,
      surname,
      countryCode,
      isAdmin: admin,
      profileCompletedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      name,
      surname,
      countryCode,
      isAdmin: admin,
      profileCompletedAt: new Date(),
      provider: 'google',
    },
  })

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!isProfileComplete(profile)) {
    return { error: 'No se pudo completar el perfil' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/complete-profile')

  return { success: true }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
