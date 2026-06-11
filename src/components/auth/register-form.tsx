'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { COUNTRIES } from '@/lib/domain/countries'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countryCode, setCountryCode] = useState('PE')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      body: JSON.stringify({ name, surname, email, password, countryCode }),
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
      subtitle="Regístrate para guardar tu álbum en la nube"
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
            <input className={authInputClassName()} value={name} onChange={(e) => setName(e.target.value)} required />
          </AuthField>
          <AuthField label="Apellido">
            <input className={authInputClassName()} value={surname} onChange={(e) => setSurname(e.target.value)} required />
          </AuthField>
        </div>

        <AuthField label="País">
          <select
            className={authInputClassName()}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            required
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthField label="Correo">
          <input
            className={authInputClassName()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AuthField>

        <AuthField label="Contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
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
