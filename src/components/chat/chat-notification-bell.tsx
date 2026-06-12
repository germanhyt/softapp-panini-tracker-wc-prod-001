'use client'

import Link from 'next/link'
import { useChatUnreadCount } from '@/hooks/use-chat-unread'

type ChatNotificationBellProps = {
  className?: string
}

export function ChatNotificationBell({ className = '' }: ChatNotificationBellProps) {
  const { totalUnread } = useChatUnreadCount()
  const label =
    totalUnread > 0
      ? `${totalUnread} mensaje${totalUnread === 1 ? '' : 's'} sin leer`
      : 'Sin mensajes nuevos'

  return (
    <Link
      href="/chat"
      className={`chat-notification-bell ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <span className="chat-notification-bell-icon" aria-hidden="true">
        🔔
      </span>
      {totalUnread > 0 && (
        <span className="chat-notification-bell-count">{totalUnread > 99 ? '99+' : totalUnread}</span>
      )}
    </Link>
  )
}
