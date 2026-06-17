'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChatUnreadCount } from '@/hooks/use-chat-unread'

type BottomNavProps = {
  isAdmin?: boolean
}

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/album', label: 'Álbum', icon: '📖' },
  // { href: '/mercado', label: 'Mercado', icon: '🏪' },
  // { href: '/matches', label: 'Play Bar', icon: '🤝' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/admin', label: 'Admin', icon: '🛡️' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
  // { href: '/extras', label: 'Extras', icon: '📦' },
]

const collectorLinks = [
  { href: '/mercado', label: 'Mercado', icon: '🏪' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/profile', label: 'Cuenta', icon: '👤' },
]

export function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname()
  const { totalUnread } = useChatUnreadCount()
  const links = isAdmin ? adminLinks : collectorLinks

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== '/mercado' && pathname.startsWith(`${link.href}/`))
        const showUnread = link.href === '/chat' && totalUnread > 0

        return (
          <Link key={link.href} href={link.href} className={`bottom-nav-link ${active ? 'active' : ''}`.trim()}>
            <span className="bottom-nav-icon-wrap">
              <span className="icon">{link.icon}</span>
              {showUnread && (
                <span className="bottom-nav-unread-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
              )}
            </span>
            <span>{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
