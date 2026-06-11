import Image from 'next/image'
import Link from 'next/link'

type SiteFooterProps = {
  /** Espacio extra cuando hay barra de navegación fija inferior */
  withBottomNav?: boolean
}

export function SiteFooter({ withBottomNav = false }: SiteFooterProps) {
  return (
    <footer className={`site-footer${withBottomNav ? ' site-footer--with-nav' : ''}`}>
      <div className="site-footer-brand">
        <Image
          src="/logo-refugio.png"
          alt="Refugio Gastronómico"
          width={80}
          height={80}
          className="site-footer-logo"
        />
        <p className="site-footer-credit">Un proyecto de Refugio Gastronómico</p>
      </div>
      <Link href="/privacidad" className="site-footer-link">
        Política de privacidad
      </Link>
    </footer>
  )
}
