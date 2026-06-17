import Link from 'next/link'
import { auth } from '@/auth'
import { signOutAction } from '@/app/actions/profile'
import { BrandLogo } from '@/components/brand/brand-logo'
import { ChatNotificationBell } from '@/components/chat/chat-notification-bell'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SiteFooter } from '@/components/layout/site-footer'
import { getHomeRouteForUser } from '@/lib/auth/home-route'
import { getRegisteredMemberCount } from '@/lib/matches/service'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isAdmin = Boolean(session?.user?.isAdmin)
  const initial = (session?.user?.name || session?.user?.email || 'U').slice(0, 1).toUpperCase()
  const memberCount = await getRegisteredMemberCount()
  const formattedMembers = new Intl.NumberFormat('es-PE').format(memberCount)
  const homeHref = getHomeRouteForUser(isAdmin)

  return (
    <>
      <header className="app-header brand-header">
        <div className="brand-block">
          <BrandLogo
            size="md"
            linked
            href={homeHref}
            subtitle={
              isAdmin
                ? 'Completar el álbum es más rápido cuando todos aportamos.'
                : 'Mercado y chat con Refugio Gastronómico.'
            }
          />
          {isAdmin && memberCount > 0 && (
            <p className="brand-members">{formattedMembers} miembros registrados</p>
          )}
        </div>
        <div className="user-info">
          <ChatNotificationBell />
          <Link href="/profile" className="header-profile-link" title="Ver mi perfil">
            <div className="header-avatar">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="Foto de perfil" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="header-profile-text">
              <strong>{session?.user?.name || 'Coleccionista'}</strong>
              <small>{isAdmin ? 'Mi perfil ⚙️' : 'Mi cuenta ⚙️'}</small>
            </div>
          </Link>
          {!isAdmin && (
            <Link href="/mercado" className="header-logout">
              Mercado
            </Link>
          )}
          <form action={signOutAction}>
            <button type="submit" className="header-logout">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="main-content">{children}</main>
      <SiteFooter withBottomNav />
      <BottomNav isAdmin={isAdmin} />
    </>
  )
}
