'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AuthField,
  AuthLink,
  AuthMessage,
  AuthShell,
  authInputClassName,
} from '@/components/auth/auth-shell'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(
    token ? null : 'Falta el enlace de restablecimiento. Solicita uno nuevo.',
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(data.error || 'No se pudo restablecer la contraseña')
        return
      }

      router.push('/login?reset=1')
      router.refresh()
    } catch {
      setError('No se pudo restablecer la contraseña. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta"
      footer={
        <p className="text-center text-sm text-[var(--text-secondary)]">
          <AuthLink href="/forgot-password">Solicitar nuevo enlace</AuthLink>
        </p>
      }
    >
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField label="Nueva contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
        </AuthField>
        <AuthField label="Confirmar contraseña">
          <input
            className={authInputClassName()}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
          />
        </AuthField>
        <button type="submit" className="btn-primary w-full" disabled={loading || !token}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthShell>
  )
}
