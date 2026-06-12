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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogle = async () => {
    setError(null)
    document.cookie = 'auth_intent=login; path=/; max-age=300; SameSite=Lax'
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <AuthShell
      title="Ingresar"
      subtitle="Accede a tu álbum y matches de intercambio"
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
            required
            autoComplete="email"
          />
        </AuthField>
        <AuthField label="Contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
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
        <button type="button" className="btn-primary w-full" onClick={handleGoogle}>
          Continuar con Google
        </button>
      </div>
    </AuthShell>
  )
}
