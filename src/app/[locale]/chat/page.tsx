'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  borrow_request_id: string | null
  last_message_at: string
  participant_1_name: string | null
  participant_1_avatar: string | null
  participant_2_name: string | null
  participant_2_avatar: string | null
  request_message: string | null
  item_title: string | null
  unread_count?: number
}

export default function ChatPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchConversations()
  }, [user, router, authLoading])

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      // Get unread message counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)

          return {
            ...conv,
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null
    
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

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start chatting with people who have applied for your items or whose items you've requested.
            </p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              if (!otherParticipant) return null

              return (
                <Card key={conversation.id} className="p-4 hover:shadow-md transition-shadow">
                  <Link href={`/chat/${conversation.id}`}>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {otherParticipant.name || 'Unknown User'}
                          </h3>
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        {conversation.item_title && (
                          <p className="text-sm text-muted-foreground mb-1">
                            About: {conversation.item_title}
                          </p>
                        )}
                        
                        {conversation.request_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            "{conversation.request_message}"
                          </p>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatLastMessageTime(conversation.last_message_at)}
                      </div>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}