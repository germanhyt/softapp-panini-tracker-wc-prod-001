import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, '.env')

function loadEnvFile() {
  if (!existsSync(envPath)) return {}
  const lines = readFileSync(envPath, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const fileEnv = loadEnvFile()
const required = ['DATABASE_URL', 'AUTH_SECRET', 'NEXTAUTH_URL']
const missing = required.filter((key) => !(process.env[key] || fileEnv[key]))

console.log('Panini Tracker — verificación de setup\n')

if (!existsSync(envPath)) {
  console.log('❌ No existe .env')
  console.log('   Copia .env.example → .env y completa los valores.\n')
} else {
  console.log('✅ Archivo .env encontrado\n')
}

if (missing.length > 0) {
  console.log('❌ Variables faltantes o vacías:')
  missing.forEach((key) => console.log(`   - ${key}`))
  console.log('')
} else {
  console.log('✅ Variables obligatorias presentes\n')
}

const databaseUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL
if (databaseUrl) {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
    await prisma.$queryRaw`SELECT 1`
    const countries = await prisma.country.count()
    const stickers = await prisma.sticker.count()
    console.log(`✅ Conexión PostgreSQL OK (${countries} países, ${stickers} figuritas en catálogo)`)
    if (countries === 0 || stickers === 0) {
      console.log('⚠️  Ejecuta: npm run db:seed')
    }
    await prisma.$disconnect()
  } catch (error) {
    console.log('❌ No se pudo conectar a PostgreSQL')
    console.log(`   ${error instanceof Error ? error.message : String(error)}`)
    console.log('   Revisa DATABASE_URL, que PostgreSQL esté encendido y que exista la base de datos.')
    console.log('   Luego: npm run db:migrate && npm run db:seed')
  }
}

const nextAuthUrl = process.env.NEXTAUTH_URL || fileEnv.NEXTAUTH_URL
if (nextAuthUrl?.includes(':3000') && process.argv.includes('--port3001')) {
  console.log('\n⚠️  NEXTAUTH_URL apunta a :3000 pero el servidor usa :3001')
  console.log('   Usa NEXTAUTH_URL=http://localhost:3001')
}

console.log('\nOpcional: ADMIN_EMAILS, AUTH_GOOGLE_ID/SECRET (Google login), SMTP_* (correo real)')
