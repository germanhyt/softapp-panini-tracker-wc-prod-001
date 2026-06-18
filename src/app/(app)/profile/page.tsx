import { auth } from '@/auth'
import { signOutAction } from '@/app/actions/profile'
import { loadSessionUser } from '@/lib/auth/session-user'
import { MarketSelectionPanel } from '@/components/market/market-selection-panel'
import { MarketSettingsPanel } from '@/components/market/market-settings-panel'
import { MEETING_POINT } from '@/lib/brand'
import { APP_COUNTRY_CODE, getCountryName } from '@/lib/domain/countries'
import { computeStats, mergeSavedStickers } from '@/lib/domain/progress'
import { getUserSavedStickerMap } from '@/lib/stickers/service'
import Link from 'next/link'

function formatPhone(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('51')) {
    return `+51 ${digits.slice(2)}`
  }
  return phone
}

export default async function ProfilePage() {
  const session = await auth()
  const isAdmin = Boolean(session?.user?.isAdmin)
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null

  if (isAdmin) {
    const saved = session?.user?.id ? await getUserSavedStickerMap(session.user.id) : {}
    const stats = computeStats(mergeSavedStickers(saved))

    return (
      <div>
        <h2 className="page-title">👤 Mi perfil</h2>

        <div className="flex flex-col gap-4">
          <section className="card space-y-2">
            <h3 className="text-lg font-semibold">{user?.displayName}</h3>
            <p className="muted-small">{user?.email}</p>
            <p className="muted-small">📍 {getCountryName(user?.countryCode || APP_COUNTRY_CODE)}</p>
            {formatPhone(user?.phone) && <p className="muted-small">📱 {formatPhone(user?.phone)}</p>}
            <p className="muted-small">Cuenta empresa · {MEETING_POINT.venue}</p>
          </section>

          <section className="card space-y-2">
            <h3 className="text-lg font-semibold">Tu colección</h3>
            <p className="muted-small">
              {stats.owned}/{stats.total} pegadas · {stats.duplicates} repetidas · {stats.missing} faltantes
            </p>
          </section>

          <MarketSettingsPanel />
          <MarketSelectionPanel />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title">👤 Mi cuenta</h2>

      <div className="flex flex-col gap-4">
        <section className="card space-y-2">
          <h3 className="text-lg font-semibold">{user?.displayName}</h3>
          <p className="muted-small">{user?.email}</p>
          <p className="muted-small">📍 {getCountryName(user?.countryCode || APP_COUNTRY_CODE)}</p>
          {formatPhone(user?.phone) && <p className="muted-small">📱 {formatPhone(user?.phone)}</p>}
          <p className="muted-small">
            Usa el mercado para ver figuritas disponibles y el chat para coordinar tu visita a {MEETING_POINT.label}.
          </p>
        </section>

        <section className="card space-y-3">
          <h3 className="text-lg font-semibold">Accesos rápidos</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/mercado" className="btn-primary">
              Ver mercado
            </Link>
            <Link href="/chat" className="btn-secondary">
              Ir al chat
            </Link>
          </div>
        </section>

        <section className="card space-y-2">
          <h3 className="text-lg font-semibold">Sesión</h3>
          <form action={signOutAction}>
            <button type="submit" className="btn-neutral-small">
              Cerrar sesión
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
