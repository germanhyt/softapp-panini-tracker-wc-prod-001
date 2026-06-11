'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { buildVisualReportRows, type VisualLabelMeta } from '@/lib/domain/visual-report'
import { useStickers } from '@/hooks/use-stickers'

type VisualReportViewProps = {
  displayName: string
}

function VisualRowLabel({ meta, fullName }: { meta: VisualLabelMeta; fullName: string }) {
  return (
    <div className="visual-report-row-label" title={fullName}>
      <span className="visual-report-label-media">
        {meta.type === 'flag' && meta.flagCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="visual-report-flag-img" src={`https://flagcdn.com/w40/${meta.flagCode}.png`} alt="" loading="lazy" />
        ) : (
          <span className={`visual-report-brand-badge ${meta.type === 'brand' ? meta.brand : ''}`}>
            {meta.type === 'brand' ? meta.text : ''}
          </span>
        )}
      </span>
      <span className="visual-report-label-separator">-</span>
      <strong>{meta.code}</strong>
    </div>
  )
}

export function VisualReportView({ displayName }: VisualReportViewProps) {
  const { savedStickers, loading } = useStickers()

  const rows = useMemo(() => buildVisualReportRows(savedStickers), [savedStickers])

  if (loading) {
    return <div className="loading">🧾 Preparando reporte visual...</div>
  }

  return (
    <div className="visual-report-page">
      <div className="trade-report-actions no-print">
        <Link href="/dashboard" className="btn-secondary">
          ← Volver
        </Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      <div className="visual-report-sheet">
        <div className="visual-report-summary visual-report-summary-legend-only">
          <div className="visual-report-legend">
            <span>
              <i className="legend-missing" /> Faltan
            </span>
            <span>
              <i className="legend-owned" /> Pegadas
            </span>
            <span>
              <i className="legend-duplicate-one" /> Repetidas (01)
            </span>
            <span>
              <i className="legend-duplicate-multi" /> Repetidas (02+)
            </span>
          </div>
        </div>

        <div className="visual-report-grid" aria-label="Mapa visual de figuritas obtenidas y faltantes">
          {rows.map((row) => (
            <div key={row.id} className="visual-report-row" title={row.fullName}>
              <VisualRowLabel meta={row.labelMeta} fullName={row.fullName} />

              <div className="visual-report-cells">
                {Array.from({ length: 20 }, (_, index) => {
                  const cell = row.cells[index]
                  if (!cell) {
                    return <span key={`blank-${index}`} className="visual-sticker-cell blank" />
                  }

                  return (
                    <span
                      key={cell.code}
                      className={`visual-sticker-cell ${cell.owned ? 'owned' : 'missing'} ${cell.duplicates === 1 ? 'duplicate-one' : ''} ${cell.duplicates > 1 ? 'duplicate-multi' : ''}`}
                      title={`${cell.code} · ${cell.owned ? (cell.duplicates === 1 ? 'Repetida (01) para cambiar' : cell.duplicates > 1 ? 'Repetidas (02+) para cambiar' : 'Pegada') : 'Falta'}`}
                    >
                      {cell.number}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <footer className="visual-report-footer">
          <span>Panini World Cup 2026 Sticker Tracker</span>
          <strong>{displayName}</strong>
        </footer>
      </div>
    </div>
  )
}
