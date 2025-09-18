import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export const useRealtimeChat = (chatId, userId) => {
  const [messages, setMessages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!chatId || !userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      // Load videos
      const { data: videosData, error: videosError } = await supabase
        .from('video')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })

      if (videosError) throw videosError

      setMessages(messagesData || [])
      setVideos(videosData || [])
    } catch (error) {
      console.error('Error loading initial chat data:', error)
    } finally {
      setLoading(false)
    }
  }, [chatId, userId])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!chatId) return

    // Subscribe to message changes
    const messageChannel = supabase
      .channel(`chat-${chatId}-messages`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === payload.new.id)) {
            return prev
          }
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'message',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => prev.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        ))
      })
      .subscribe()

    // Subscribe to video changes
    const videoChannel = supabase
      .channel(`chat-${chatId}-videos`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'video',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setVideos(prev => {
          // Avoid duplicates
          if (prev.some(video => video.id === payload.new.id)) {
            return prev
          }
          return [payload.new, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'video',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setVideos(prev => prev.map(video => 
          video.id === payload.new.id ? payload.new : video
        ))
      })
      .subscribe()

    return () => {
      messageChannel.unsubscribe()
      videoChannel.unsubscribe()
    }
  }, [chatId])

  return {
    messages,
    videos,
    loading,
    refetch: loadInitialData
  }
}