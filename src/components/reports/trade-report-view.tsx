'use client'

import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import { buildTradeReportData } from '@/lib/domain/trade-report'
import { useStickers } from '@/hooks/use-stickers'

type TradeReportViewProps = {
  displayName: string
  email: string
}

type ReportSectionProps<T> = {
  title: string
  subtitle: string
  emptyText: string
  groups: Record<string, T[]>
  className?: string
  renderItem: (item: T) => ReactNode
}

function ReportSection<T>({
  title,
  subtitle,
  emptyText,
  groups,
  renderItem,
  className = '',
}: ReportSectionProps<T>) {
  const groupEntries = Object.entries(groups)

  return (
    <section className={`trade-report-section ${className}`.trim()}>
      <div className="trade-report-section-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      {groupEntries.length === 0 ? (
        <p className="trade-report-empty">{emptyText}</p>
      ) : (
        <div className="trade-report-groups">
          {groupEntries.map(([groupName, items]) => (
            <div key={groupName} className="trade-report-group">
              <h4>{groupName}</h4>
              <div className="trade-report-items">{items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function TradeReportView({ displayName, email }: TradeReportViewProps) {
  const { savedStickers, loading } = useStickers()

  const report = useMemo(() => buildTradeReportData(savedStickers), [savedStickers])

  const printedAt = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  if (loading) {
    return <div className="loading">🧾 Preparando reporte para trueque...</div>
  }

  return (
    <div className="trade-report-page">
      <div className="trade-report-actions no-print">
        <Link href="/dashboard" className="btn-secondary">
          ← Volver
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      <div className="trade-report-sheet">
        <header className="trade-report-header">
          <div>
            <h1>Reporte para trueque</h1>
            <p>Álbum Panini FIFA World Cup 2026</p>
          </div>
          <div className="trade-report-meta">
            <strong>{displayName}</strong>
            <span>{email}</span>
            <span>Fecha: {printedAt}</span>
          </div>
        </header>

        <div className="trade-report-summary">
          <div>
            <strong>{report.stats.owned}</strong>
            <span>Pegadas</span>
          </div>
          <div>
            <strong>{report.stats.missing}</strong>
            <span>Faltantes</span>
          </div>
          <div>
            <strong>{report.stats.duplicates}</strong>
            <span>Repetidas</span>
          </div>
          <div>
            <strong>{report.percent}%</strong>
            <span>Completado</span>
          </div>
        </div>

        <div className="trade-report-notes">
          <span>Usa los casilleros para marcar a mano durante el intercambio.</span>
          <span>Luego actualiza el dashboard con lo entregado y recibido.</span>
        </div>

        <div className="trade-report-blocks">
          <ReportSection
            title="REPETIDAS"
            subtitle="Marca las repetidas que entregas. El número entre paréntesis indica cuántas tienes disponibles."
            emptyText="No tienes repetidas disponibles registradas."
            groups={report.duplicatedGroups}
            className="trade-report-obtained"
            renderItem={(item) => (
              <div key={item.code} className="trade-report-check-item obtained-item">
                <span className="paper-checkbox checked">X</span>
                <strong>{item.code}</strong>
                {item.duplicates > 0 && <em>({String(item.duplicates).padStart(2, '0')})</em>}
              </div>
            )}
          />

          <ReportSection
            title="ME FALTAN"
            subtitle="Marca a mano las figuras que recibes y anota por cuál repetida la cambiaste."
            emptyText="No tienes faltantes registradas."
            groups={report.missingGroups}
            className="trade-report-missing"
            renderItem={(code) => (
              <div key={code} className="trade-report-check-item missing-item">
                <span className="paper-checkbox" />
                <strong>{code}</strong>
                <span className="exchange-line">x ______</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
}
