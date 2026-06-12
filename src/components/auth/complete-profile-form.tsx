'use client'

import { useActionState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { completeProfileAction } from '@/app/actions/profile'
import { APP_COUNTRY_CODE, getCountryName } from '@/lib/domain/countries'
import {
  AuthField,
  AuthMessage,
  AuthShell,
  authInputClassName,
} from '@/components/auth/auth-shell'

export function CompleteProfileForm() {
  const [state, action, pending] = useActionState(completeProfileAction, {})
  const { data: session, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      update().then(() => {
        router.push('/dashboard')
        router.refresh()
      })
    }
  }, [state.success, update, router])

  return (
    <AuthShell
      title="Completa tu perfil"
      subtitle="Necesitamos tu nombre para personalizar matches en Perú"
    >
      {state.error && <AuthMessage tone="error">{state.error}</AuthMessage>}

      <form action={action} className="space-y-4">
        <AuthField label="Nombre">
          <input
            className={authInputClassName()}
            name="name"
            defaultValue={session?.user?.name?.split(' ')[0] || ''}
            required
          />
        </AuthField>
        <AuthField label="Apellido">
          <input
            className={authInputClassName()}
            name="surname"
            defaultValue={session?.user?.name?.split(' ').slice(1).join(' ') || ''}
            required
          />
        </AuthField>
        <AuthField label="País">
          <input type="hidden" name="countryCode" value={APP_COUNTRY_CODE} />
          <p className="auth-country-fixed">{getCountryName(APP_COUNTRY_CODE)}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Esta aplicación está orientada solo para coleccionistas en Perú.
          </p>
        </AuthField>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? 'Guardando...' : 'Continuar al dashboard'}
        </button>
      </form>
    </AuthShell>
  )
}
