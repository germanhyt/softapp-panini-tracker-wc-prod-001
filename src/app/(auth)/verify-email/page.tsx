import { Suspense } from 'react'
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--text-secondary)]">Cargando...</div>}>
      <VerifyEmailPanel />
    </Suspense>
  )
}
