'use client'

import { useActionState, useState } from 'react'
import { useSession } from 'next-auth/react'
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
  const { data: session } = useSession()
  const today = new Date().toISOString().slice(0, 10)
  const [phone, setPhone] = useState('')

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    setPhone(digits)
  }

  return (
    <AuthShell
      title="Completa tu perfil"
      subtitle="Necesitamos tus datos para personalizar matches en Perú"
    >
      {state.error && <AuthMessage tone="error">{state.error}</AuthMessage>}

      <form action={action} className="space-y-4">
        <AuthField label="Nombre">
          <input
            className={authInputClassName()}
            name="name"
            defaultValue={session?.user?.name?.split(' ')[0] || ''}
            autoComplete="given-name"
            minLength={2}
            maxLength={60}
            pattern="[A-Za-zÀ-ÿ' ]+"
            title="Ingresa un nombre válido"
            required
          />
        </AuthField>
        <AuthField label="Apellido">
          <input
            className={authInputClassName()}
            name="surname"
            defaultValue={session?.user?.name?.split(' ').slice(1).join(' ') || ''}
            autoComplete="family-name"
            minLength={2}
            maxLength={60}
            pattern="[A-Za-zÀ-ÿ' ]+"
            title="Ingresa un apellido válido"
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField label="Celular (Perú)">
            <div className="flex items-center gap-2">
              <span className="auth-country-fixed min-w-14 text-center">+51</span>
              <input
                className={authInputClassName()}
                name="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="912345678"
                autoComplete="tel-national"
                minLength={9}
                maxLength={9}
                pattern="9[0-9]{8}"
                title="Ingresa 9 dígitos de celular peruano"
                required
              />
            </div>
          </AuthField>
          <AuthField label="Fecha de nacimiento">
            <input
              className={authInputClassName()}
              name="birthDate"
              type="date"
              min="1900-01-01"
              max={today}
              required
            />
          </AuthField>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? 'Guardando...' : 'Continuar al dashboard'}
        </button>
      </form>
    </AuthShell>
  )
}
