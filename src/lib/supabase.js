import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Users
  getUser: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  updateUser: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Chats
  getChats: async (userId) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  createChat: async (chatData) => {
    const { data, error } = await supabase
      .from('chats')
      .insert(chatData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateChat: async (chatId, updates) => {
    const { data, error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Messages
  getMessages: async (chatId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  createMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Videos
  getVideos: async (chatId) => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  createVideo: async (videoData) => {
    const { data, error } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateVideo: async (videoId, updates) => {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// File upload helper
export const uploadFile = async (file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { data, error } = await supabase.storage
    .from('files')
    .upload(filePath, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath)

  return { file_url: publicUrl, path: filePath }
}