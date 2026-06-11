import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--text-secondary)]">Cargando...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
