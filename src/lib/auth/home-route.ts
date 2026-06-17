export function getHomeRouteForUser(isAdmin: boolean): '/dashboard' | '/mercado' {
  return isAdmin ? '/dashboard' : '/mercado'
}

export const COLLECTOR_APP_ROUTES = ['/chat', '/profile'] as const

export const ADMIN_APP_ROUTES = [
  '/dashboard',
  '/album',
  '/matches',
  '/admin',
  '/extras',
  '/visual-report',
  '/trade-report',
] as const

export function isCollectorAppRoute(pathname: string): boolean {
  return COLLECTOR_APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function isAdminOnlyAppRoute(pathname: string): boolean {
  return ADMIN_APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
