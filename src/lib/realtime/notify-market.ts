function isConnectionRefused(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const cause = (error as { cause?: { code?: string; errors?: Array<{ code?: string }> } }).cause
  if (cause?.code === 'ECONNREFUSED') return true
  return Boolean(cause?.errors?.some((entry) => entry.code === 'ECONNREFUSED'))
}

export async function notifyMarketUpdated(): Promise<void> {
  const url = process.env.WS_NOTIFY_URL
  const secret = process.env.WS_NOTIFY_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[mercado] WS_NOTIFY_URL o WS_NOTIFY_SECRET no configurados; el mercado no se actualizará en vivo.',
      )
    }
    return
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-ws-notify-secret': secret,
      },
      cache: 'no-store',
    })

    if (!response.ok && process.env.NODE_ENV === 'development') {
      console.warn(`[mercado] Notificación WS respondió ${response.status} (${url})`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development' && isConnectionRefused(error)) {
      console.warn(
        '[mercado] Servidor WebSocket no disponible. En local ejecuta `yarn dev:ws` o `yarn dev:all` para actualización instantánea.',
      )
      return
    }

    console.error('No se pudo notificar actualización del mercado:', error)
  }
}
