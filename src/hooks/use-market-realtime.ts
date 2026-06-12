'use client'

import { useEffect, useRef, useState } from 'react'
import { getPublicWsUrl } from '@/lib/chat/ws-token'

const POLL_INTERVAL_MS = 12_000

type UseMarketRealtimeOptions = {
  enabled?: boolean
  onRefresh: () => void
}

export function useMarketRealtime({ enabled = true, onRefresh }: UseMarketRealtimeOptions) {
  const [live, setLive] = useState(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) {
      setLive(false)
      return
    }

    let ws: WebSocket | null = null
    let reconnectTimer: number | null = null
    let closed = false

    const connect = () => {
      if (closed) return

      ws = new WebSocket(getPublicWsUrl())

      ws.onopen = () => {
        setLive(true)
        ws?.send(JSON.stringify({ type: 'market_subscribe' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string }
          if (data.type === 'market_refresh') {
            onRefreshRef.current()
          }
        } catch {
          // ignore malformed payloads
        }
      }

      ws.onclose = () => {
        setLive(false)
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      ws?.close()
      setLive(false)
    }
  }, [enabled])

  // Si el WS no está disponible (p. ej. olvidaste `yarn dev:ws`), refresca en segundo plano.
  useEffect(() => {
    if (!enabled || live) return

    const interval = window.setInterval(() => {
      onRefreshRef.current()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [enabled, live])

  return { live }
}
