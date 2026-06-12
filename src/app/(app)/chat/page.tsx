import { ChatInboxView } from '@/components/chat/chat-inbox-view'
import { MEETING_POINT } from '@/lib/brand'

export default function ChatPage() {
  return (
    <div>
      <h2 className="page-title">💬 Chat interno</h2>
      <p className="muted-small chat-page-intro">
        Conversaciones privadas entre coleccionistas en Perú. Usa la campana 🔔 del encabezado para ver mensajes
        nuevos. Los trueques presenciales se coordinan en {MEETING_POINT.label}.
      </p>
      <ChatInboxView />
    </div>
  )
}
