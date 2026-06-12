import Image from 'next/image'
import Link from 'next/link'
import { BRAND_TITLE } from '@/lib/brand'

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  linked?: boolean
  href?: string
  showTitle?: boolean
  subtitle?: string
}

const sizeMap = {
  sm: { width: 40, height: 40, title: 'text-sm', subtitle: 'text-[11px]' },
  md: { width: 56, height: 56, title: 'text-base', subtitle: 'text-xs' },
  lg: { width: 72, height: 72, title: 'text-xl', subtitle: 'text-sm' },
} as const

export function BrandLogo({
  size = 'md',
  linked = false,
  href = '/dashboard',
  showTitle = true,
  subtitle,
}: BrandLogoProps) {
  const sizing = sizeMap[size]

  const content = (
    <div className="brand-logo">
      <div className="brand-logo-image-wrap">
        <Image
          src="/logo-panini.jpg"
          alt={`Logo ${BRAND_TITLE}`}
          width={sizing.width}
          height={sizing.height}
          className="brand-logo-image"
          priority
        />
      </div>
      {showTitle && (
        <div className="brand-logo-text">
          <strong className={sizing.title}>{BRAND_TITLE}</strong>
          {subtitle && <span className={`brand-logo-subtitle ${sizing.subtitle}`}>{subtitle}</span>}
        </div>
      )}
    </div>
  )

  if (linked) {
    return (
      <Link href={href} className="brand-logo-link">
        {content}
      </Link>
    )
  }

  return content
}
