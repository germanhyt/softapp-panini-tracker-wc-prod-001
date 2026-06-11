import { ChatInboxView } from '@/components/chat/chat-inbox-view'

export default function ChatPage() {
  return (
    <div>
      <h2 className="page-title">💬 Chat interno</h2>
      <p className="muted-small chat-page-intro">
        Conversaciones privadas entre coleccionistas. Solo tú y la otra persona pueden ver y escribir aquí.
      </p>
      <ChatInboxView />
    </div>
  )
}
