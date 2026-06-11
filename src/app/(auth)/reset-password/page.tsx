import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--text-secondary)]">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
