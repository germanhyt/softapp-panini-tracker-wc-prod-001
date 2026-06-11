import { auth } from '@/auth'
import { loadSessionUser } from '@/lib/auth/session-user'
import { MarketSettingsPanel } from '@/components/market/market-settings-panel'
import { getCountryName } from '@/lib/domain/countries'
import { computeStats, mergeSavedStickers } from '@/lib/domain/progress'
import { getUserSavedStickerMap } from '@/lib/stickers/service'

export default async function ProfilePage() {
  const session = await auth()
  const user = session?.user?.id ? await loadSessionUser(session.user.id) : null
  const saved = session?.user?.id ? await getUserSavedStickerMap(session.user.id) : {}
  const stats = computeStats(mergeSavedStickers(saved))

  return (
    <div>
      <h2 className="page-title">👤 Mi perfil</h2>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">{user?.displayName}</h3>
        <p className="muted-small">{user?.email}</p>
        {user?.countryCode && <p className="muted-small">📍 {getCountryName(user.countryCode)}</p>}
      </section>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">Tu colección</h3>
        <p className="muted-small">
          {stats.owned}/{stats.total} pegadas · {stats.duplicates} repetidas · {stats.missing} faltantes
        </p>
      </section>

      <MarketSettingsPanel />
    </div>
  )
}
