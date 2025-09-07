import { supabase } from './supabase'

export interface ChatUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  borrow_request_id: string | null
  last_message_at: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

/**
 * Create or get existing conversation between two users for a specific borrow request
 */
export async function createOrGetConversation(
  userId1: string,
  userId2: string,
  borrowRequestId?: string
): Promise<{ data: Conversation | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: userId1,
      p_user2_id: userId2,
      p_borrow_request_id: borrowRequestId || null
    })

    if (error) {
      return { data: null, error }
    }

    // Fetch the created/found conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', data)
      .single()

    return { data: conversation, error: fetchError }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    })
    .select(`
      *,
      sender:users(full_name, avatar_url)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }

  // Update conversation's last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Format the message with sender info
  const message: Message = {
    ...data,
    sender_name: data.sender?.full_name,
    sender_avatar: data.sender?.avatar_url
  }

  return message
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<{ data: Message[] | null; error: any }> {
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
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('conversation_details')
      .select('*')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(
  userId: string
): Promise<{ data: number; error: any }> {
  try {
    // Get all conversations for the user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)

    if (convError || !conversations) {
      return { data: 0, error: convError }
    }

    const conversationIds = conversations.map(c => c.id)

    if (conversationIds.length === 0) {
      return { data: 0, error: null }
    }

    // Count unread messages in all user's conversations
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false)

    return { data: count || 0, error }
  } catch (error) {
    return { data: 0, error }
  }
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onMessage(payload.new as Message)
      }
    )
    .subscribe()
}

/**
 * Subscribe to conversation updates for a user
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: () => void
) {
  return supabase
    .channel(`user_conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant_1_id=eq.${userId}`
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant_2_id=eq.${userId}`
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      onUpdate
    )
    .subscribe()
}