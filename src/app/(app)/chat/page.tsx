import { ChatInboxView } from '@/components/chat/chat-inbox-view'
import { MEETING_POINT } from '@/lib/brand'

export default function ChatPage() {
  return (
    <div>
      <h2 className="page-title">💬 Chat interno</h2>
      <p className="muted-small chat-page-intro">
        Escribe a {MEETING_POINT.venue} para consultar disponibilidad antes de acercarte a {MEETING_POINT.label}.
        Usa la campana 🔔 del encabezado para ver mensajes nuevos.
      </p>
      <ChatInboxView />
    </div>
  )
}
