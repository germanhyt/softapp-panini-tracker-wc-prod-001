export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase())
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function cleanText(value: string): string {
  return String(value || '').trim()
}

export function splitDisplayName(displayName = ''): { name: string; surname: string } {
  const parts = cleanText(displayName).split(' ').filter(Boolean)
  const name = parts.shift() || ''
  const surname = parts.join(' ')
  return { name, surname }
}

export function isProfileComplete(profile?: {
  name?: string | null
  surname?: string | null
  countryCode?: string | null
  phone?: string | null
  birthDate?: Date | null
} | null): boolean {
  return Boolean(
    cleanText(profile?.name || '') &&
    cleanText(profile?.surname || '') &&
    cleanText(profile?.countryCode || '') &&
    cleanText(profile?.phone || '') &&
    profile?.birthDate,
  )
}

export function buildDisplayName(name?: string | null, surname?: string | null, email?: string | null): string {
  const full = `${cleanText(name || '')} ${cleanText(surname || '')}`.trim()
  return full || email || 'Usuario'
}
