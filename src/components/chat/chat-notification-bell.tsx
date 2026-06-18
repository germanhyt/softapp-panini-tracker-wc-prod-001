'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useChatUnreadCount } from '@/hooks/use-chat-unread'

type ChatNotificationBellProps = {
  className?: string
}

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedAudioContext) {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    sharedAudioContext = new Ctx()
  }
  return sharedAudioContext
}

function playThinNotificationSound() {
  const audioContext = getAudioContext()
  if (!audioContext || audioContext.state !== 'running') return

  const now = audioContext.currentTime
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(1244, now)
  oscillator.frequency.exponentialRampToValueAtTime(1567, now + 0.1)

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.2)
}

export function ChatNotificationBell({ className = '' }: ChatNotificationBellProps) {
  const { totalUnread } = useChatUnreadCount()
  const previousUnreadRef = useRef<number | null>(null)

  useEffect(() => {
    const audioContext = getAudioContext()
    if (!audioContext) return

    const unlock = () => {
      if (audioContext.state !== 'running') {
        void audioContext.resume()
      }
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const previousUnread = previousUnreadRef.current
    if (previousUnread !== null && totalUnread > previousUnread) {
      playThinNotificationSound()
    }
    previousUnreadRef.current = totalUnread
  }, [totalUnread])

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
