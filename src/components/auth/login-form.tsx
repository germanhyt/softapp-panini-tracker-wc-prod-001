'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AuthField,
  AuthLink,
  AuthMessage,
  AuthShell,
  authInputClassName,
} from '@/components/auth/auth-shell'

function mapLoginError(code: string | null): string | null {
  if (!code) return null
  if (code === 'GoogleNotRegistered') {
    return 'Esta cuenta de Google no está registrada. Crea tu cuenta en Registro.'
  }
  if (code === 'CredentialsSignin') {
    return 'Correo o contraseña incorrectos.'
  }
  if (code === 'OAuthAccountNotLinked') {
    return 'Este correo ya está registrado con contraseña. Ingresa con tu correo y contraseña, o usa el mismo Google para vincular la cuenta.'
  }
  return 'No se pudo iniciar sesión. Intenta nuevamente.'
}

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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(mapLoginError(searchParams.get('error')))
  const [info, setInfo] = useState<string | null>(() => {
    if (searchParams.get('verified')) return 'Correo verificado. Ya puedes iniciar sesión.'
    if (searchParams.get('reset')) return 'Contraseña actualizada. Ya puedes iniciar sesión.'
    return null
  })
  const [loading, setLoading] = useState(false)

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error === 'email_not_verified') {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      return
    }

    if (result?.error) {
      setError('Correo o contraseña incorrectos.')
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleGoogle = async () => {
    setError(null)
    document.cookie = 'auth_intent=login; path=/; max-age=300; SameSite=Lax'
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accede al mercado y chatea con Refugio Gastronómico"
      footer={
        <div className="space-y-2 text-center text-sm text-[var(--text-secondary)]">
          <p>
            ¿No tienes cuenta? <AuthLink href="/register">Regístrate</AuthLink>
          </p>
          <p>
            <AuthLink href="/mercado">Ver mercado público de figuritas</AuthLink>
          </p>
          <p className="text-xs">
            <AuthLink href="/privacidad">Política de privacidad</AuthLink>
          </p>
        </div>
      }
    >
      {info && <AuthMessage tone="success">{info}</AuthMessage>}
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      <form className="space-y-4" onSubmit={handleCredentials}>
        <AuthField label="Correo">
          <input
            className={authInputClassName()}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            autoComplete="email"
          />
        </AuthField>
        <AuthField label="Contraseña">
          <div className="relative">
            <input
              className={`${authInputClassName()} pr-10`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
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
          <div className="pt-1 text-right">
            <AuthLink href="/forgot-password">¿Olvidaste tu contraseña?</AuthLink>
          </div>
        </AuthField>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
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
          <span>Continuar con Google</span>
        </button>
      </div>
    </AuthShell>
  )
}
