# Viduto Migration Plan: Base44 to Bolt.new + Supabase

## Phase 1: Project Setup and Core Structure (Week 1)

### 1.1 Initialize Bolt.new Project
```bash
# Create new Bolt.new project with React + Vite
npm create vite@latest viduto-bolt -- --template react
cd viduto-bolt
npm install
```

### 1.2 Install Dependencies
```bash
# Core dependencies
npm install @supabase/supabase-js
npm install react-router-dom
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
npm install lucide-react
npm install tailwindcss autoprefixer postcss
npm install class-variance-authority clsx tailwind-merge
npm install react-hook-form @hookform/resolvers zod
npm install sonner react-hot-toast
npm install framer-motion
npm install react-markdown

# Development dependencies
npm install -D @types/node
```

### 1.3 Project Structure Setup
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── chat/         # Chat interface components
│   ├── video/        # Video-related components
│   ├── marketing/    # Landing page components
│   └── layout/       # Layout components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
├── pages/            # Page components
├── styles/           # Global styles
└── types/            # TypeScript definitions
```

## Phase 2: Core Infrastructure Migration (Week 2)

### 2.1 Supabase Configuration
The existing Supabase setup is already well-structured. We'll optimize it:

```javascript
// lib/supabase.js - Enhanced version
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Enhanced auth helpers
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
```

### 2.2 Database Schema Optimization
The current schema is solid. Minor enhancements:

```sql
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_user_last_activity ON chat(user_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_chat_status ON video(chat_id, status);
CREATE INDEX IF NOT EXISTS idx_message_chat_created ON message(chat_id, created_at);

-- Add RLS policies for better security
CREATE POLICY "Users can manage own subscription" ON users
  FOR ALL USING (auth.uid()::text = id::text);
```

## Phase 3: Component Migration (Week 3-4)

### 3.1 Authentication System
Migrate and enhance the existing auth components:

```jsx
// components/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getCurrentUser().then(setUser).finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn: auth.signInWithGoogle, signOut: auth.signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 3.2 Chat Interface Enhancement
Improve the existing ChatInterface with better state management:

```jsx
// components/chat/ChatInterface.jsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { db } from '@/lib/supabase'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { VideoPreview } from './VideoPreview'

export const ChatInterface = ({ chatId, onChatUpdate }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)

  const loadChatData = useCallback(async () => {
    if (!chatId || !user) return
    
    try {
      const [messagesData, videosData] = await Promise.all([
        db.getMessages(chatId),
        db.getVideos(chatId)
      ])
      
      setMessages(messagesData || [])
      setVideos(videosData || [])
    } catch (error) {
      console.error('Error loading chat data:', error)
    }
  }, [chatId, user])

  useEffect(() => {
    loadChatData()
  }, [loadChatData])

  const handleSendMessage = async (content, file) => {
    if (!user || !chatId) return
    
    setLoading(true)
    try {
      let fileUrl = null
      if (file) {
        const { file_url } = await uploadFile(file)
        fileUrl = file_url
      }

      const message = await db.createMessage({
        chat_id: chatId,
        message_type: 'user',
        content,
        metadata: fileUrl ? { image_url: fileUrl } : {}
      })

      setMessages(prev => [...prev, message])
      
      // Trigger video generation
      await initiateVideoGeneration(chatId, content, fileUrl)
      
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} videos={videos} />
      <MessageInput onSend={handleSendMessage} loading={loading} />
    </div>
  )
}
```

## Phase 4: Advanced Features (Week 5-6)

### 4.1 Real-time Updates
Implement Supabase real-time subscriptions:

```jsx
// hooks/useRealtimeChat.js
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useRealtimeChat = (chatId) => {
  const [messages, setMessages] = useState([])
  const [videos, setVideos] = useState([])

  useEffect(() => {
    if (!chatId) return

    // Subscribe to message changes
    const messageSubscription = supabase
      .channel(`chat-${chatId}-messages`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    // Subscribe to video updates
    const videoSubscription = supabase
      .channel(`chat-${chatId}-videos`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVideos(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setVideos(prev => prev.map(v => v.id === payload.new.id ? payload.new : v))
        }
      })
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      videoSubscription.unsubscribe()
    }
  }, [chatId])

  return { messages, videos }
}
```

### 4.2 Enhanced Video Processing
Implement proper video generation workflow:

```jsx
// lib/videoGeneration.js
export const initiateVideoGeneration = async (chatId, prompt, imageUrl) => {
  try {
    // Create video record
    const video = await db.createVideo({
      chat_id: chatId,
      prompt,
      image_url: imageUrl,
      status: 'queued'
    })

    // Call video generation API (replace with actual service)
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: video.id,
        prompt,
        imageUrl
      })
    })

    if (!response.ok) {
      throw new Error('Video generation failed')
    }

    return video
  } catch (error) {
    console.error('Error initiating video generation:', error)
    throw error
  }
}
```

## Phase 5: UI/UX Enhancements (Week 7)

### 5.1 Design System Implementation
Create a comprehensive design system:

```jsx
// components/ui/design-system.jsx
export const designTokens = {
  colors: {
    primary: {
      50: '#fff7ed',
      500: '#f97316', // Orange
      600: '#ea580c',
      900: '#9a3412'
    },
    secondary: {
      500: '#3b82f6', // Blue
      600: '#2563eb'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  }
}
```

### 5.2 Responsive Layout System
```jsx
// components/layout/ResponsiveLayout.jsx
export const ResponsiveLayout = ({ children, sidebar, header }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          {sidebar}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          {sidebar}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {header}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Phase 6: Testing and Optimization (Week 8)

### 6.1 Performance Optimization
- Implement React.memo for expensive components
- Add lazy loading for routes
- Optimize bundle size with code splitting
- Implement proper error boundaries

### 6.2 Testing Strategy
```jsx
// tests/components/ChatInterface.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { AuthProvider } from '@/components/auth/AuthProvider'

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('ChatInterface', () => {
  test('renders message input', () => {
    renderWithAuth(<ChatInterface chatId="test-chat" />)
    expect(screen.getByPlaceholderText(/describe your video/i)).toBeInTheDocument()
  })

  test('sends message on form submit', async () => {
    renderWithAuth(<ChatInterface chatId="test-chat" />)
    
    const input = screen.getByPlaceholderText(/describe your video/i)
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })
})
```

## Migration Challenges and Solutions

### Challenge 1: Base44 API Dependencies
**Solution:** Replace Base44 API calls with direct Supabase operations
- Map Base44 entities to Supabase tables
- Replace API functions with Supabase client methods
- Implement proper error handling

### Challenge 2: Authentication Flow
**Solution:** The project already uses Supabase Auth, minimal changes needed
- Ensure proper session management
- Implement refresh token handling
- Add proper error states

### Challenge 3: File Upload System
**Solution:** Optimize existing Supabase Storage implementation
- Add file type validation
- Implement progress tracking
- Add compression for large images

### Challenge 4: Real-time Features
**Solution:** Implement Supabase real-time subscriptions
- Replace polling with WebSocket connections
- Add proper connection state management
- Implement reconnection logic

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1 | Week 1 | Project setup, dependencies |
| 2 | Week 2 | Core infrastructure, database |
| 3 | Week 3-4 | Component migration |
| 4 | Week 5-6 | Advanced features |
| 5 | Week 7 | UI/UX enhancements |
| 6 | Week 8 | Testing, optimization |

**Total Estimated Time:** 8 weeks

## Post-Migration Checklist

- [ ] All components migrated and functional
- [ ] Authentication flow working
- [ ] Database operations optimized
- [ ] Real-time features implemented
- [ ] UI/UX matches original design
- [ ] Performance optimized
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployment pipeline configured

## Conclusion

This migration plan leverages the existing Supabase infrastructure while optimizing the frontend for Bolt.new compatibility. The project is already well-architected, making the migration primarily a restructuring and optimization effort rather than a complete rewrite.