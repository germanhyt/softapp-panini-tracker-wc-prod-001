'use client'

import { useEffect, useRef, useState } from 'react'
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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 4l16 16M10.6 10.6a2 2 0 102.8 2.8M9.88 5.09A11.8 11.8 0 0112 4c5.25 0 9.27 3.44 10.5 8-0.46 1.7-1.33 3.22-2.5 4.45M6.7 6.7C4.73 8.03 3.27 9.9 2.5 12A11.86 11.86 0 005.6 16.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M2.5 12C3.73 7.44 7.75 4 13 4s9.27 3.44 10.5 8c-1.23 4.56-5.25 8-10.5 8S3.73 16.56 2.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M21.8 12.2c0-.73-.07-1.42-.2-2.08H12v3.94h5.5a4.7 4.7 0 01-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.5z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.75 0 5.05-.9 6.73-2.45l-3.3-2.56c-.92.62-2.1 1-3.43 1-2.64 0-4.88-1.78-5.67-4.17H2.93v2.63A10 10 0 0012 22z"
        fill="#34A853"
      />
      <path
        d="M6.33 13.82A5.98 5.98 0 016 12c0-.63.11-1.24.33-1.82V7.55H2.93A10 10 0 002 12c0 1.6.38 3.11 1.06 4.45l3.27-2.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.01c1.5 0 2.86.52 3.92 1.53l2.94-2.94C17.04 2.9 14.75 2 12 2a10 10 0 00-9.07 5.55l3.4 2.63C7.12 7.79 9.36 6.01 12 6.01z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const autoGoogleTriggered = useRef(false)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  useEffect(() => {
    if (autoGoogleTriggered.current) return
    const shouldStartGoogle = new URLSearchParams(window.location.search).get('google') === '1'
    if (!shouldStartGoogle) return
    autoGoogleTriggered.current = true
    document.cookie = 'auth_intent=register; path=/; max-age=300; SameSite=Lax'
    void signIn('google', { callbackUrl: '/complete-profile' })
  }, [])

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
              placeholder="correo@ejemplo.com"
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
          <div className="relative">
            <input
              className={`${authInputClassName()} pr-10`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crea tu contraseña"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </AuthField>

        <AuthField label="Confirmar contraseña">
          <div className="relative">
            <input
              className={`${authInputClassName()} pr-10`}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-secondary)] hover:text-[var(--text)]"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon open={showConfirmPassword} />
            </button>
          </div>
        </AuthField>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <div className="space-y-3">
        <div className="text-center text-xs text-[var(--text-secondary)]">o</div>
        <button
          type="button"
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
          onClick={handleGoogle}
        >
          <GoogleIcon />
          <span>Registrarme con Google</span>
        </button>
      </div>
    </AuthShell>
  )
}
