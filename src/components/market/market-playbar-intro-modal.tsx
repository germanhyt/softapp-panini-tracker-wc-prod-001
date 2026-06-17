'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { MEETING_POINT } from '@/lib/brand'

const STORAGE_KEY = 'panini-playbar-intro-dismissed'

type MarketPlayBarIntroModalProps = {
  forceOpen?: boolean
}

export function MarketPlayBarIntroModal({ forceOpen = false }: MarketPlayBarIntroModalProps) {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (forceOpen) {
      setOpen(true)
      return
    }
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [forceOpen])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open])

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore storage errors
    }
    setOpen(false)
  }

  if (!mounted || !open) return null

  return createPortal(
    <div className="market-intro-modal-backdrop" onClick={dismiss} role="presentation">
      <div
        className="market-intro-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="market-intro-modal-close" onClick={dismiss} aria-label="Cerrar">
          ✕
        </button>
        <p className="market-hero-kicker">Canje presencial</p>
        <h2 id={titleId} className="market-intro-modal-title">
          Acércate a {MEETING_POINT.label}
        </h2>
        <p className="muted-small">{MEETING_POINT.policyNote}</p>
        <p className="muted-small">
          Aquí ves el catálogo publicado por {MEETING_POINT.venue}. Regístrate o inicia sesión para ver el detalle y
          escribirnos antes de ir al local.
        </p>
        <div className="market-intro-modal-actions">
          <Link href="/register" className="btn-primary" onClick={dismiss}>
            Crear cuenta
          </Link>
          <Link href="/login" className="btn-secondary" onClick={dismiss}>
            Iniciar sesión
          </Link>
          <button type="button" className="btn-neutral-small" onClick={dismiss}>
            Explorar catálogo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
