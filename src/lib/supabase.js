import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced auth helpers with better error handling
export const auth = {
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
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
    if (error) return null
    return user
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Enhanced database helpers with proper error handling
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
      .from('chat')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  createChat: async (chatData) => {
    const { data, error } = await supabase
      .from('chat')
      .insert(chatData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateChat: async (chatId, updates) => {
    const { data, error } = await supabase
      .from('chat')
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
      .from('message')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  createMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('message')
      .insert(messageData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Videos
  getVideos: async (chatId) => {
    const { data, error } = await supabase
      .from('video')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  createVideo: async (videoData) => {
    const { data, error } = await supabase
      .from('video')
      .insert(videoData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateVideo: async (videoId, updates) => {
    const { data, error } = await supabase
      .from('video')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Blog Posts
  getBlogPosts: async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (error) throw error
    return data
  },

  getBlogPostById: async (id) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
    if (error) throw error
    return data
  },

  getBlogPostBySlug: async (slug) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    if (error) throw error
    return data
  }
}

// Enhanced file upload helper with validation
export const uploadFile = async (file) => {
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB')
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only image files are allowed')
  }

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