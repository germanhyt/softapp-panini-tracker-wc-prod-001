import { auth } from '@/auth'
import { BrandLogo } from '@/components/brand/brand-logo'
import { LoginQrTrigger } from '@/components/auth/login-qr-trigger'
import { SiteFooter } from '@/components/layout/site-footer'
import { getLoginUrl } from '@/lib/app-url'

export default async function MercadoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isAuthenticated = Boolean(session?.user?.profileComplete)
  const loginUrl = await getLoginUrl()

  return (
    <div className="public-shell">
      <header className="public-header brand-header">
        <BrandLogo
          size="lg"
          linked
          href={isAuthenticated ? '/dashboard' : '/mercado'}
          subtitle="Mercado de figuritas"
        />
        <div className="public-header-actions">
          <LoginQrTrigger initialLoginUrl={loginUrl} />
        </div>
      </header>
      <main className="main-content public-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
