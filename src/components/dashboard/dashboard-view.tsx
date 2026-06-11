'use client'

import Link from 'next/link'
import { buildSectionProgress, computeStats } from '@/lib/domain/progress'
import { useStickers } from '@/hooks/use-stickers'

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

      <div className="card dashboard-actions">
        <Link href="/album" className="btn-primary dashboard-link-button">
          📖 Ver álbum por páginas
        </Link>
        <div className="dashboard-report-actions">
          <Link href="/visual-report" className="btn-secondary dashboard-report-button">
            🧾 Reporte visual de faltantes
          </Link>
          <Link href="/trade-report" className="btn-secondary dashboard-report-button">
            📋 Reporte para trueque
          </Link>
          <Link href="/mercado" className="btn-secondary dashboard-report-button">
            🏪 Mercado público
          </Link>
        </div>
        <p className="muted-small">
          Marca figuritas por página, guarda antes de cambiar de sección e imprime tus reportes para intercambios en persona.
        </p>
      </div>

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
