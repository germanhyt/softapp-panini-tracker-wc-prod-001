'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLink, AuthMessage, AuthShell } from '@/components/auth/auth-shell'

function readStoredDevLink(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('panini_dev_verification_url') || ''
}

export function VerifyEmailPanel() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const errorCode = searchParams.get('error')
  const [devLink, setDevLink] = useState(readStoredDevLink)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    errorCode === 'invalid'
      ? 'El enlace de verificación expiró o no es válido.'
      : errorCode === 'missing'
        ? 'Falta el token de verificación.'
        : null,
  )
  const [loading, setLoading] = useState(false)

  const resend = async () => {
    if (!email) {
      setError('No encontramos el correo. Vuelve a registrarte.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = (await response.json()) as { devVerificationUrl?: string; error?: string }
    setLoading(false)

    if (!response.ok) {
      setError(data.error || 'No se pudo reenviar el correo.')
      return
    }

    if (data.devVerificationUrl) {
      setDevLink(data.devVerificationUrl)
      sessionStorage.setItem('panini_dev_verification_url', data.devVerificationUrl)
      setInfo('En desarrollo no se envía correo real. Usa el enlace de abajo para verificar.')
      return
    }

    setInfo('Te enviamos un nuevo enlace de verificación. Revisa tu bandeja.')
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Confirma tu email para acceder al tracker"
      footer={
        <p className="text-center text-sm text-[var(--text-secondary)]">
          ¿Ya verificaste? <AuthLink href="/login">Ingresar</AuthLink>
        </p>
      }
    >
      {email && (
        <AuthMessage tone="info">
          {devLink ? (
            <>
              Cuenta creada para <strong>{email}</strong>. Usa el botón de abajo para verificar tu correo.
            </>
          ) : (
            <>
              Enviamos un enlace de verificación a <strong>{email}</strong>. Revisa tu bandeja de entrada y la carpeta
              de spam. Si no llega en unos minutos, usa &quot;Reenviar correo&quot;.
            </>
          )}
        </AuthMessage>
      )}
      {devLink && (
        <div className="space-y-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3">
          <p className="text-xs text-[var(--text-secondary)]">Enlace de verificación (solo desarrollo):</p>
          <a href={devLink} className="btn-primary block w-full text-center no-underline">
            ✅ Verificar correo ahora
          </a>
        </div>
      )}
      {info && <AuthMessage tone="success">{info}</AuthMessage>}
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      <button type="button" className="btn-primary w-full" onClick={resend} disabled={loading || !email}>
        {loading ? 'Reenviando...' : devLink ? 'Generar nuevo enlace' : 'Reenviar correo'}
      </button>
    </AuthShell>
  )
}
