'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUnreadMessageCount } from '@/lib/chat'
import { supabase } from '@/lib/supabase'

export function useNotifications() {
  const { user } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unapprovedRequests, setUnapprovedRequests] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch unread message count
  const fetchUnreadMessages = async () => {
    if (!user) {
      setUnreadMessages(0)
      return
    }

    try {
      const { data, error } = await getUnreadMessageCount(user.id)
      if (!error) {
        setUnreadMessages(data)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  // Fetch unapproved request count
  const fetchUnapprovedRequests = async () => {
    if (!user) {
      setUnapprovedRequests(0)
      return
    }

    try {
      // Count pending requests for items the user owns
      const { count, error } = await supabase
        .from('borrow_requests')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('status', 'pending')

      if (!error) {
        setUnapprovedRequests(count || 0)
      }
    } catch (error) {
      console.error('Error fetching unapproved requests:', error)
    }
  }

  // Fetch all notification counts
  const fetchNotifications = async () => {
    setLoading(true)
    await Promise.all([
      fetchUnreadMessages(),
      fetchUnapprovedRequests()
    ])
    setLoading(false)
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [user])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Subscribe to message changes
    const messageSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .subscribe()

    // Subscribe to request changes
    const requestSubscription = supabase
      .channel('borrow_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `owner_id=eq.${user.id}`
        },
        () => {
          fetchUnapprovedRequests()
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      requestSubscription.unsubscribe()
    }
  }, [user])

  return {
    unreadMessages,
    unapprovedRequests,
    loading,
    refresh: fetchNotifications
  }
}