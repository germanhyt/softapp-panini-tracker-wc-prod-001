import { NextResponse } from 'next/server'
import { getRegisteredMemberCount } from '@/lib/matches/service'

export async function GET() {
  try {
    const total = await getRegisteredMemberCount()
    return NextResponse.json({ total })
  } catch (error) {
    console.error('Member count error:', error)
    return NextResponse.json({ total: null }, { status: 500 })
  }
}
