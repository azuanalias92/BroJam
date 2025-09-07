'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender_name?: string
  sender_avatar?: string
}

interface ConversationDetails {
  id: string
  participant_1_id: string
  participant_2_id: string
  borrow_request_id: string | null
  participant_1_name: string | null
  participant_1_avatar: string | null
  participant_2_name: string | null
  participant_2_avatar: string | null
  item_title: string | null
}

interface ChatConversationPageProps {
  params: {
    conversationId: string
  }
}

export default function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchConversation()
    fetchMessages()
    markMessagesAsRead()
    
    // Subscribe to new messages
    const subscription = supabase
      .channel(`conversation:${params.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${params.conversationId}`
        },
        async (payload) => {
          console.log('New message received:', payload)
          const newMessageData = payload.new as any
          
          // Fetch sender details for the new message
          const { data: senderData } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', newMessageData.sender_id)
            .single()
          
          const newMessage: Message = {
            ...newMessageData,
            sender_name: senderData?.full_name,
            sender_avatar: senderData?.avatar_url
          }
          
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === newMessage.id)
            if (exists) return prev
            return [...prev, newMessage]
          })
          
          // Mark as read if not sent by current user
          if (newMessage.sender_id !== user.id) {
            markMessageAsRead(newMessage.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Unsubscribing from channel')
      subscription.unsubscribe()
    }
  }, [user, params.conversationId, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('id', params.conversationId)
        .single()

      if (error) {
        console.error('Error fetching conversation:', error)
        router.push('/chat')
        return
      }

      // Check if user is participant
      if (data.participant_1_id !== user?.id && data.participant_2_id !== user?.id) {
        router.push('/chat')
        return
      }

      setConversation(data)
    } catch (error) {
      console.error('Error fetching conversation:', error)
      router.push('/chat')
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', params.conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      const messagesWithSender = data.map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name,
        sender_avatar: msg.sender?.avatar_url
      }))

      setMessages(messagesWithSender)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    if (!user) return

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', params.conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    
    try {
      const { data: sentMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      console.log('Message sent:', sentMessage)
      setNewMessage('')
      
      // Add message immediately for better UX (real-time will handle duplicates)
      setMessages(prev => {
        const exists = prev.find(msg => msg.id === sentMessage.id)
        if (exists) return prev
        return [...prev, sentMessage]
      })
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const getOtherParticipant = () => {
    if (!conversation || !user) return null
    
    if (conversation.participant_1_id === user.id) {
      return {
        id: conversation.participant_2_id,
        name: conversation.participant_2_name,
        avatar: conversation.participant_2_avatar
      }
    } else {
      return {
        id: conversation.participant_1_id,
        name: conversation.participant_1_name,
        avatar: conversation.participant_1_avatar
      }
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/chat">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
          
          {otherParticipant && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {otherParticipant.avatar ? (
                  <img 
                    src={otherParticipant.avatar} 
                    alt={otherParticipant.name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {otherParticipant.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">
                  {otherParticipant.name || 'Unknown User'}
                </h1>
                {conversation?.item_title && (
                  <p className="text-sm text-muted-foreground">
                    About: {conversation.item_title}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <Card className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {message.sender_avatar ? (
                        <img 
                          src={message.sender_avatar} 
                          alt={message.sender_name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {message.sender_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </Avatar>
                    
                    <div className={`flex flex-col ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  )
}