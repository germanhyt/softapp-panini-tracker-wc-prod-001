'use client'

import { useState } from 'react'
import {
  AuthField,
  AuthLink,
  AuthMessage,
  AuthShell,
  authInputClassName,
} from '@/components/auth/auth-shell'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json()) as {
        error?: string
        message?: string
        devResetUrl?: string
      }

      if (!response.ok) {
        setError(data.error || 'No se pudo enviar el enlace')
        return
      }

      setInfo(data.message || 'Revisa tu correo para continuar.')
      if (data.devResetUrl) {
        setInfo(`${data.message} Enlace de desarrollo: ${data.devResetUrl}`)
      }
    } catch {
      setError('No se pudo enviar el enlace. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva contraseña"
      footer={
        <p className="text-center text-sm text-[var(--text-secondary)]">
          <AuthLink href="/login">Volver a iniciar sesión</AuthLink>
        </p>
      }
    >
      {info && <AuthMessage tone="success">{info}</AuthMessage>}
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
    </AuthShell>
  )
}
