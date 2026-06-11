import Link from 'next/link'
import { auth } from '@/auth'
import { signOutAction } from '@/app/actions/profile'
import { BrandLogo } from '@/components/brand/brand-logo'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SiteFooter } from '@/components/layout/site-footer'
import { getRegisteredMemberCount } from '@/lib/matches/service'

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const initial = (session?.user?.name || session?.user?.email || 'U').slice(0, 1).toUpperCase()
  const memberCount = await getRegisteredMemberCount()
  const formattedMembers = new Intl.NumberFormat('es-PE').format(memberCount)

  return (
    <>
      <header className="app-header brand-header">
        <div className="brand-block">
          <BrandLogo
            size="md"
            linked
            href="/dashboard"
            subtitle="Completar el álbum es más rápido cuando todos aportamos."
          />
          {memberCount > 0 && <p className="brand-members">{formattedMembers} miembros registrados</p>}
        </div>
        <div className="user-info">
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
              <small>Mi perfil ⚙️</small>
            </div>
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="header-logout">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="main-content">{children}</main>
      <SiteFooter withBottomNav />
      <BottomNav isAdmin={Boolean(session?.user?.isAdmin)} />
    </>
  )
}
