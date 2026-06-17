import Link from 'next/link'
import { auth } from '@/auth'
import { signOutAction } from '@/app/actions/profile'
import { BrandLogo } from '@/components/brand/brand-logo'
import { LoginQrTrigger } from '@/components/auth/login-qr-trigger'
import { SiteFooter } from '@/components/layout/site-footer'
import { getHomeRouteForUser } from '@/lib/auth/home-route'
import { getLoginUrl } from '@/lib/app-url'

export default async function MercadoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isAuthenticated = Boolean(session?.user?.profileComplete)
  const isAdmin = Boolean(session?.user?.isAdmin)
  const loginUrl = await getLoginUrl()
  const homeHref = isAuthenticated ? getHomeRouteForUser(isAdmin) : '/mercado'

  return (
    <div className="public-shell">
      <header className="public-header brand-header">
        <BrandLogo size="lg" linked href={homeHref} subtitle="Catálogo para canje en Play Bar" />
        <div className="public-header-actions">
          {isAuthenticated ? (
            <>
              <Link href="/chat" className="btn-secondary">
                Chat
              </Link>
              <Link href="/profile" className="btn-neutral-small">
                {isAdmin ? 'Perfil' : 'Cuenta'}
              </Link>
              {!isAdmin && (
                <form action={signOutAction}>
                  <button type="submit" className="btn-neutral-small">
                    Salir
                  </button>
                </form>
              )}
              {isAdmin && (
                <>
                  <Link href="/dashboard" className="btn-neutral-small">
                    Panel
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className="btn-neutral-small">
                      Salir
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Ingresar
              </Link>
              <LoginQrTrigger initialLoginUrl={loginUrl} />
            </>
          )}
        </div>
      </header>
      <main className="main-content public-main mercado-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
