import Link from 'next/link'
import { BrandLogo } from '@/components/brand/brand-logo'
import { ORG_NAME } from '@/lib/brand'
import { SiteFooter } from '@/components/layout/site-footer'

type AuthShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <main className="auth-shell">
        <div className="card auth-card w-full max-w-md space-y-6">
          <header className="auth-card-header space-y-4 text-center">
            <BrandLogo size="lg" linked href="/mercado" subtitle={ORG_NAME} />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
            </div>
          </header>
          {children}
          {footer}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function AuthMessage({ tone, children }: { tone: 'error' | 'info' | 'success'; children: React.ReactNode }) {
  const styles = {
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    info: 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)]',
    success: 'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]',
  }

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}>
      {children}
    </div>
  )
}

export function AuthLink(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`text-sm text-[var(--accent)] hover:underline ${props.className || ''}`}
    />
  )
}

export function AuthField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  )
}

export function authInputClassName() {
  return 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]'
}
