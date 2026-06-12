'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import type { MarketUserSettings } from '@/lib/market/service'

type SettingKey = 'showInMarket' | 'publishOffers' | 'publishWants'

const settingOptions: Array<{
  key: SettingKey
  title: string
  description: string
}> = [
  {
    key: 'showInMarket',
    title: 'Perfil visible',
    description: 'Permite que otros usuarios te encuentren en el mercado público.',
  },
  {
    key: 'publishOffers',
    title: 'Publicar repetidas',
    description: 'Muestra las figuritas que tienes de más para intercambiar.',
  },
  {
    key: 'publishWants',
    title: 'Publicar faltantes',
    description: 'Muestra las figuritas que aún te faltan en el álbum.',
  },
]

export function MarketSettingsPanel() {
  const [settings, setSettings] = useState<MarketUserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/market/settings')
      if (!response.ok) throw new Error('Failed to load settings')
      const payload = (await response.json()) as MarketUserSettings
      setSettings(payload)
    } catch (loadError) {
      console.error('Error loading market settings:', loadError)
      setError('No se pudieron cargar los ajustes del mercado.')
    } finally {
      setLoading(false)
    }
  }, [])

  useOnMount(() => loadSettings())

  const updateSetting = async (key: SettingKey) => {
    if (!settings) return

    setSavingKey(key)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/market/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !settings[key] }),
      })
      if (!response.ok) throw new Error('Failed to update settings')
      const payload = (await response.json()) as MarketUserSettings
      setSettings(payload)

      if (key === 'showInMarket') {
        setMessage(payload.showInMarket ? 'Tu perfil ya es visible en el mercado público.' : 'Tu perfil ya no aparece en el mercado.')
      } else if (key === 'publishOffers') {
        setMessage(payload.publishOffers ? 'Se habilitó la publicación de repetidas.' : 'Se ocultaron tus repetidas del mercado.')
      } else {
        setMessage(payload.publishWants ? 'Se habilitó la publicación de faltantes.' : 'Se ocultaron tus faltantes del mercado.')
      }
    } catch (updateError) {
      console.error('Error updating market settings:', updateError)
      setError('No se pudo guardar el ajuste seleccionado.')
    } finally {
      setSavingKey(null)
    }
  }

  const syncListings = async () => {
    if (!settings?.publishOffers && !settings?.publishWants) {
      setError('Selecciona al menos repetidas o faltantes antes de publicar.')
      return
    }

    setSyncing(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/market', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync listings')
      const payload = (await response.json()) as {
        offerCount: number
        wantCount: number
        settings?: MarketUserSettings
      }

      if (payload.settings) {
        setSettings(payload.settings)
      } else {
        await loadSettings()
      }

      const parts: string[] = []
      if (settings.publishOffers) parts.push(`${payload.offerCount} repetidas`)
      if (settings.publishWants) parts.push(`${payload.wantCount} faltantes`)
      setMessage(`Publicación actualizada: ${parts.join(' y ')}.`)
    } catch (syncError) {
      console.error('Error syncing market listings:', syncError)
      setError('No se pudo publicar tu colección. Guarda tu álbum antes de intentarlo.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <section className="card market-settings-card">
        <p className="loading">Cargando ajustes del mercado...</p>
      </section>
    )
  }

  return (
    <section className="card market-settings-card">
      <div className="market-settings-intro">
        <div>
          <h3 className="text-lg font-semibold">Mercado público</h3>
          <p className="muted-small">
            Activa qué tipos de publicación quieres mostrar. Luego puedes elegir figuritas específicas en la sección de
            abajo.
          </p>
        </div>
      </div>

      <div className="market-settings-stats">
        <div className="market-stat-pill market-stat-pill-offer">
          <strong>{settings?.offerCount ?? 0}</strong>
          <span>Repetidas activas</span>
        </div>
        <div className="market-stat-pill market-stat-pill-want">
          <strong>{settings?.wantCount ?? 0}</strong>
          <span>Faltantes activas</span>
        </div>
      </div>

      {settings?.lastSyncedAt && (
        <p className="muted-small">
          Última actualización:{' '}
          {new Date(settings.lastSyncedAt).toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      <div className="market-setting-options">
        {settingOptions.map((option) => {
          const active = settings?.[option.key] ?? false
          const busy = savingKey === option.key

          return (
            <button
              key={option.key}
              type="button"
              className={`market-setting-option ${active ? 'is-active' : ''}`}
              disabled={busy}
              onClick={() => void updateSetting(option.key)}
            >
              <span className="market-setting-option-head">
                <strong>{option.title}</strong>
                <span className={`market-setting-switch ${active ? 'is-on' : ''}`} aria-hidden="true">
                  <span />
                </span>
              </span>
              <span className="muted-small">{option.description}</span>
            </button>
          )
        })}
      </div>

      <div className="market-settings-actions">
        <button type="button" className="btn-primary" disabled={syncing} onClick={() => void syncListings()}>
          {syncing ? 'Publicando...' : 'Publicar / actualizar colección'}
        </button>
        <Link href="/mercado" className="btn-secondary">
          Ver mercado público
        </Link>
      </div>

      {message && <p className="market-message-success">{message}</p>}
      {error && <p className="market-message-error">{error}</p>}

      <p className="muted-small">
        Solo se muestra tu nombre abreviado y país. Tu correo no aparece en el mercado público.
      </p>
    </section>
  )
}
