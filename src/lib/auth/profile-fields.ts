const PERU_MOBILE_REGEX = /^9\d{8}$/

export function normalizePeruPhone(rawPhone: string): string | null {
  const digits = String(rawPhone || '').replace(/\D/g, '')
  let local = ''

  if (digits.startsWith('51') && digits.length === 11) {
    local = digits.slice(2)
  } else if (digits.length === 9) {
    local = digits
  }

  if (!PERU_MOBILE_REGEX.test(local)) {
    return null
  }

  return `+51${local}`
}

export function parseBirthDateInput(rawBirthDate: string): Date | null {
  const value = String(rawBirthDate || '').trim()
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  if (parsed.toISOString().slice(0, 10) !== value) return null

  const min = new Date('1900-01-01T00:00:00.000Z')
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  if (parsed < min || parsed > today) {
    return null
  }

  return parsed
}
