'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type BottomNavProps = {
  isAdmin?: boolean
}

const baseLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/album', label: 'Álbum', icon: '📖' },
  { href: '/matches', label: 'Matches', icon: '🤝' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
  { href: '/extras', label: 'Extras', icon: '📦' },
]

export function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname()
  const links = isAdmin
    ? [...baseLinks.slice(0, 4), { href: '/admin', label: 'Admin', icon: '🛡️' }, baseLinks[4]]
    : baseLinks

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
            <span className="icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
