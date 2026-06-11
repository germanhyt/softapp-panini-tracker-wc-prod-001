import { NextResponse } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 10_000

function pruneExpired(now: number): void {
  if (buckets.size <= MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitConfig = {
  key: string
  limit: number
  windowMs: number
}

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: 0; resetAt: number; retryAfterSec: number }

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const existing = buckets.get(config.key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs
    buckets.set(config.key, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt }
  }

  if (existing.count >= config.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, retryAfterSec }
  }

  existing.count += 1
  buckets.set(config.key, existing)
  return { allowed: true, remaining: config.limit - existing.count, resetAt: existing.resetAt }
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    },
  )
}

export function buildRateLimitKey(scope: string, parts: string[]): string {
  return `${scope}:${parts.join(':')}`
}
