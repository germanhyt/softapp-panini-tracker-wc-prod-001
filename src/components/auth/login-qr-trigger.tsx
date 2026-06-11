'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'react-qr-code'

type LoginQrTriggerProps = {
  initialLoginUrl: string
}

export function LoginQrTrigger({ initialLoginUrl }: LoginQrTriggerProps) {
  const titleId = useId()
  const loginUrl = initialLoginUrl
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="login-qr-modal-backdrop" onClick={() => setOpen(false)} role="presentation">
            <div
              className="login-qr-modal card"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="login-qr-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
              <h2 id={titleId} className="login-qr-modal-title">
                Ingresar a la app
              </h2>
              <p className="login-qr-modal-subtitle muted-small">
                Escanea el código con tu celular para abrir el login.
              </p>
              <div className="login-qr-modal-code">
                <QRCode value={loginUrl} size={220} bgColor="#ffffff" fgColor="#0f172a" level="M" />
              </div>
              <p className="login-qr-modal-url">{loginUrl}</p>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        className="login-qr-trigger"
        onClick={() => setOpen(true)}
        aria-label="Mostrar código QR para iniciar sesión"
        title="Ingresar con QR"
      >
        <span className="login-qr-trigger-code" aria-hidden="true">
          <QRCode value={loginUrl} size={40} bgColor="#ffffff" fgColor="#0f172a" level="L" />
        </span>
        <span className="login-qr-trigger-label">Ingresar</span>
      </button>
      {modal}
    </>
  )
}
