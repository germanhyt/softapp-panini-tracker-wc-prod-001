import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ChatThreadView } from '@/components/chat/chat-thread-view'
import { getConversationPeer } from '@/lib/chat/service'

type ChatThreadPageProps = {
  params: Promise<{ conversationId: string }>
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const session = await auth()
  const { conversationId } = await params

  if (!session?.user?.id) {
    redirect('/login')
  }

  const peer = await getConversationPeer(session.user.id, conversationId)
  if (!peer) {
    redirect('/chat')
  }

  return <ChatThreadView conversationId={conversationId} otherUserName={peer.displayName} />
}
