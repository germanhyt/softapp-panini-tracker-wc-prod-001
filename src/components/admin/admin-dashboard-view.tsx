'use client'

import { useCallback, useMemo, useState } from 'react'
import { useOnMount } from '@/hooks/use-on-mount'
import { buildCsvContent, downloadCsv } from '@/lib/admin/csv'
import type { AdminSummary, AdminUserRow } from '@/lib/admin/service'

type AdminDashboardViewProps = {
  adminEmail: string
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function formatRole(isAdmin: boolean): string {
  return isAdmin ? 'Empresa/Admin' : 'Coleccionista'
}

function formatPhone(phone: string | null): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('51')) {
    return `+51 ${digits.slice(2)}`
  }
  return phone
}

function initials(name: string, email: string): string {
  return (name || email || 'U').slice(0, 1).toUpperCase()
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase()
}

export function AdminDashboardView({ adminEmail }: AdminDashboardViewProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('No autorizado o error al cargar usuarios')
      }

      const data = (await response.json()) as { users: AdminUserRow[]; summary: AdminSummary }
      setUsers(data.users)
      setSummary(data.summary)
    } catch (err) {
      console.error('Error loading admin panel:', err)
      setError('No se pudo cargar la información del panel administrador.')
    } finally {
      setLoading(false)
    }
  }, [])

  useOnMount(() => loadUsers())

  const filteredUsers = useMemo(() => {
    const clean = normalizeQuery(query)
    if (!clean) return users

    return users.filter(
      (item) =>
        item.fullName.toLowerCase().includes(clean) ||
        item.email.toLowerCase().includes(clean) ||
        formatPhone(item.phone).toLowerCase().includes(clean) ||
        formatRole(item.isAdmin).toLowerCase().includes(clean) ||
        item.provider.toLowerCase().includes(clean) ||
        item.countryName.toLowerCase().includes(clean),
    )
  }, [query, users])

  const exportCsv = () => {
    const headers = [
      'Nombre',
      'Correo',
      'Rol',
      'Celular',
      'Proveedor',
      'Pais',
      'Verificado',
      'Creado',
      'Ultimo ingreso',
    ]

    const rows = filteredUsers.map((item) => [
      item.fullName,
      item.email,
      formatRole(item.isAdmin),
      formatPhone(item.phone),
      item.provider,
      item.countryName,
      item.verified ? 'Si' : 'No',
      formatDate(item.createdAt),
      formatDate(item.lastLoginAt),
    ])

    downloadCsv(
      `panini_admin_usuarios_${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsvContent(headers, rows),
    )
  }

  if (loading) {
    return <div className="loading">📈 Cargando panel administrador...</div>
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h2>🛡️ Panel administrador</h2>
          <p>Vista privada para {adminEmail}. Solo muestra datos de usuarios; no incluye figuritas.</p>
        </div>
        <button type="button" className="btn-refresh-matches" onClick={() => void loadUsers()}>
          🔄 Actualizar
        </button>
      </div>

      {error && <div className="admin-error card">⚠️ {error}</div>}

      {summary && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <strong>{summary.totalUsers}</strong>
            <span>Usuarios registrados</span>
          </div>
          <div className="admin-stat-card">
            <strong>{summary.verified}</strong>
            <span>Correos verificados</span>
          </div>
          <div className="admin-stat-card">
            <strong>{summary.google}</strong>
            <span>Registro Google</span>
          </div>
          <div className="admin-stat-card">
            <strong>{summary.password}</strong>
            <span>Registro correo</span>
          </div>
          <div className="admin-stat-card">
            <strong>{summary.admins}</strong>
            <span>Cuentas empresa/admin</span>
          </div>
          <div className="admin-stat-card">
            <strong>{summary.pendingVerification}</strong>
            <span>Pendientes de verificación</span>
          </div>
        </div>
      )}

      <div className="admin-toolbar card">
        <div>
          <label htmlFor="admin-search">Buscar usuario</label>
          <input
            id="admin-search"
            type="text"
            value={query}
            placeholder="Nombre, correo, celular, rol, país o proveedor..."
            onChange={(event) => setQuery(event.target.value)}
          />
          <small>{filteredUsers.length} usuario(s) visibles.</small>
        </div>
        <button type="button" className="btn-secondary" onClick={exportCsv} disabled={filteredUsers.length === 0}>
          ⬇️ Exportar usuarios CSV
        </button>
      </div>

      <div className="admin-users-list">
        {filteredUsers.length === 0 ? (
          <div className="card empty-matches-card">
            <p className="empty-icon">🔎</p>
            <h3>No hay usuarios para mostrar</h3>
            <p>Ajusta la búsqueda o actualiza el panel.</p>
          </div>
        ) : (
          filteredUsers.map((item) => (
            <div className="admin-user-card" key={item.id}>
              <div className="admin-user-main">
                <div className="admin-avatar">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="Foto de usuario" />
                  ) : (
                    <span>{initials(item.fullName, item.email)}</span>
                  )}
                </div>
                <div>
                  <h3>{item.fullName}</h3>
                  <p>{item.email}</p>
                  <p>{formatPhone(item.phone)}</p>
                  <div className="admin-tags">
                    <span>{formatRole(item.isAdmin)}</span>
                    <span>{item.provider}</span>
                    <span>📍 {item.countryName}</span>
                    <span>{item.verified ? 'Verificado' : 'No verificado'}</span>
                    {item.photoUrl ? <span>Con foto</span> : <span>Sin foto</span>}
                  </div>
                </div>
              </div>

              <div className="admin-user-stats">
                <span>🗓️ Creado: {formatDate(item.createdAt)}</span>
                <span>🕒 {formatDate(item.lastLoginAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
