import { headers } from 'next/headers'
import { getAppBaseUrl } from '@/lib/email/resend'

function isInternalHost(host: string): boolean {
  const normalized = host.toLowerCase()
  return (
    normalized.startsWith('0.0.0.0') ||
    normalized.startsWith('127.0.0.1') ||
    normalized.startsWith('localhost')
  )
}

export function getAppBaseUrlFromRequest(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost ?? request.headers.get('host')

  if (host && !isInternalHost(host)) {
    const proto =
      request.headers.get('x-forwarded-proto') ??
      (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
    return `${proto}://${host}`.replace(/\/$/, '')
  }

  return getAppBaseUrl()
}

export async function getRequestAppBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')

  if (host && !isInternalHost(host)) {
    const proto =
      h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
    return `${proto}://${host}`.replace(/\/$/, '')
  }

  return getAppBaseUrl()
}

export async function getLoginUrl(): Promise<string> {
  return `${await getRequestAppBaseUrl()}/login`
}
