export type Country = {
  code: string
  name: string
}

/** Aplicación orientada exclusivamente a coleccionistas en Perú. */
export const APP_COUNTRY_CODE = 'PE' as const

export const COUNTRIES: Country[] = [{ code: APP_COUNTRY_CODE, name: 'Perú' }]

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]))

export function getCountryName(code: string): string {
  return COUNTRY_BY_CODE.get(String(code || '').toUpperCase())?.name ?? ''
}

export function isAppCountryCode(code: string): boolean {
  return String(code || '').trim().toUpperCase() === APP_COUNTRY_CODE
}
