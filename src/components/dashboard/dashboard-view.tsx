'use client'

import Link from 'next/link'
import { buildSectionProgress, computeStats } from '@/lib/domain/progress'
import { useStickers } from '@/hooks/use-stickers'

const DASHBOARD_ACTIONS = [
  {
    href: '/album',
    icon: '📖',
    label: 'Ver álbum por páginas',
    hint: 'Marca pegadas y repetidas',
    primary: true,
  },
  {
    href: '/visual-report',
    icon: '🧾',
    label: 'Reporte visual',
    hint: 'Mapa de faltantes',
  },
  {
    href: '/trade-report',
    icon: '📋',
    label: 'Reporte para trueque',
    hint: 'Listo para imprimir',
  },
  {
    href: '/mercado',
    icon: '🏪',
    label: 'Mercado Play Bar',
    hint: 'Catálogo de la empresa',
  },
  {
    href: '/matches',
    icon: '🤝',
    label: 'Preparar trueque',
    hint: 'Reporte y punto de encuentro',
  },
] as const

export function DashboardView() {
  const { savedStickers, pendingChanges, saveToCloud, lastSaved, loading } = useStickers()
  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  const stats = computeStats(savedStickers)
  const sections = buildSectionProgress(savedStickers)
  const percent = stats.total ? Math.round((stats.owned / stats.total) * 100) : 0

  if (loading) {
    return <div className="loading">📊 Cargando tu álbum...</div>
  }

  return (
    <div>
      <h2 className="page-title">📊 Mi Dashboard</h2>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.owned}</div>
          <div className="stat-label">Pegadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.missing}</div>
          <div className="stat-label">Faltantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.duplicates}</div>
          <div className="stat-label">Repetidas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{percent}%</div>
          <div className="stat-label">Completado</div>
        </div>
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <section className="card dashboard-actions">
        <div className="dashboard-actions-header">
          <h3>Acciones rápidas</h3>
          <p className="muted-small">Gestiona tu álbum, imprime reportes o revisa el catálogo para intercambio.</p>
        </div>
        <div className="dashboard-actions-grid">
          {DASHBOARD_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`dashboard-action-tile ${'primary' in action && action.primary ? 'is-primary' : ''}`}
            >
              <span className="dashboard-action-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span className="dashboard-action-copy">
                <strong>{action.label}</strong>
                <small>{action.hint}</small>
              </span>
              <span className="dashboard-action-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card section-progress-panel">
        <div className="section-progress-header">
          <h3>📊 Avance por selección</h3>
          <p className="muted-small">
            Toca una sección para abrirla en el álbum y seguir marcando figuritas.
          </p>
        </div>

        <div className="section-progress-grid">
          {sections.map((section) => (
            <Link key={section.id} href={section.albumTarget} className="section-progress-card">
              <div className="section-progress-title">{section.title}</div>
              <div className="section-progress-main">
                <strong>
                  {section.owned}/{section.total}
                </strong>
                <span>{section.percent}%</span>
              </div>
              <div className="section-progress-caption">
                {section.missing} faltantes · {section.duplicates} repetida
                {section.duplicates === 1 ? '' : 's'}
              </div>
              <div className="section-progress-bar" aria-hidden="true">
                <span className={section.progressClass} style={{ width: `${section.percent}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {hasPendingChanges && (
        <button type="button" className="btn-save" onClick={() => saveToCloud()}>
          💾 Guardar cambios
          {lastSaved && (
            <span className="save-time">Último: {new Date(lastSaved).toLocaleTimeString()}</span>
          )}
        </button>
      )}
    </div>
  )
}
