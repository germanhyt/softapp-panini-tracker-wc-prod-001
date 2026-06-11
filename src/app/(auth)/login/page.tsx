import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[var(--text-secondary)]">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
