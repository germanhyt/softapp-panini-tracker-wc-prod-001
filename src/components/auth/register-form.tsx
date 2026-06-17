'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { APP_COUNTRY_CODE, getCountryName } from '@/lib/domain/countries'
import {
  AuthField,
  AuthLink,
  AuthMessage,
  AuthShell,
  authInputClassName,
} from '@/components/auth/auth-shell'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const countryCode = APP_COUNTRY_CODE
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    setPhone(digits)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, phone: `+51${phone}`, birthDate, email, password, countryCode }),
    })

    const data = (await response.json()) as { email: string; error?: string; devVerificationUrl?: string }
    setLoading(false)

    if (!response.ok) {
      setError(data.error || 'No se pudo registrar')
      return
    }

    if (data.devVerificationUrl) {
      sessionStorage.setItem('panini_dev_verification_url', data.devVerificationUrl)
    }

    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
  }

  const handleGoogle = async () => {
    document.cookie = 'auth_intent=register; path=/; max-age=300; SameSite=Lax'
    await signIn('google', { callbackUrl: '/complete-profile' })
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate para ver el mercado y chatear con la empresa"
      footer={
        <div className="space-y-2 text-center text-sm text-[var(--text-secondary)]">
          <p>
            ¿Ya tienes cuenta? <AuthLink href="/login">Ingresar</AuthLink>
          </p>
          <p>
            <AuthLink href="/mercado">Ver mercado público de figuritas</AuthLink>
          </p>
          <p className="text-xs">
            Al registrarte aceptas la <AuthLink href="/privacidad">política de privacidad</AuthLink>.
          </p>
        </div>
      }
    >
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <AuthField label="Nombre">
            <input
              className={authInputClassName()}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              autoComplete="family-name"
              minLength={2}
              maxLength={60}
              pattern="[A-Za-zÀ-ÿ' ]+"
              title="Ingresa un apellido válido"
              required
            />
          </AuthField>
        </div>

        <AuthField label="País">
          <p className="auth-country-fixed">{getCountryName(APP_COUNTRY_CODE)}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Registro disponible solo para coleccionistas en Perú.
          </p>
        </AuthField>

        <AuthField label="Correo">
          <input
            className={authInputClassName()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            required
          />
        </AuthField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AuthField label="Celular (Perú)">
            <div className="flex items-center gap-2">
              <span className="auth-country-fixed min-w-14 text-center">+51</span>
              <input
                className={authInputClassName()}
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
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              min="1900-01-01"
              max={today}
              required
            />
          </AuthField>
        </div>

        <AuthField label="Contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </AuthField>

        <AuthField label="Confirmar contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </AuthField>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <div className="space-y-3">
        <div className="text-center text-xs text-[var(--text-secondary)]">o</div>
        <button type="button" className="btn-primary w-full" onClick={handleGoogle}>
          Registrarme con Google
        </button>
      </div>
    </AuthShell>
  )
}
