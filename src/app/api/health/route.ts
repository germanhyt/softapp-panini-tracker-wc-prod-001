import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { logError } from '@/lib/observability/logger'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      timestamp,
      checks: {
        database: 'ok',
      },
    })
  } catch (error) {
    logError('health.check', error)
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp,
        checks: {
          database: 'error',
        },
      },
      { status: 503 },
    )
  }
}
