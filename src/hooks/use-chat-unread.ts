'use client'

import { useCallback, useEffect, useState } from 'react'

const POLL_INTERVAL_MS = 20_000
export const CHAT_UNREAD_CHANGED_EVENT = 'panini:chat-unread-changed'

export function notifyChatUnreadChanged() {
  window.dispatchEvent(new Event(CHAT_UNREAD_CHANGED_EVENT))
}

export function useChatUnreadCount() {
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/unread', { cache: 'no-store' })
      if (!response.ok) return
      const payload = (await response.json()) as { totalUnread?: number }
      setTotalUnread(Math.max(0, payload.totalUnread ?? 0))
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()

    const interval = window.setInterval(() => {
      void refresh()
    }, POLL_INTERVAL_MS)

    const onFocus = () => {
      void refresh()
    }

    const onUnreadChanged = () => {
      void refresh()
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener(CHAT_UNREAD_CHANGED_EVENT, onUnreadChanged)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(CHAT_UNREAD_CHANGED_EVENT, onUnreadChanged)
    }
  }, [refresh])

  return { totalUnread, loading, refresh }
}
