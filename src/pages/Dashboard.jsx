import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, User as UserIcon, CreditCard, LogOut, Plus, MessageSquare, HelpCircle, Sun, Moon, Gift, Zap, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, uploadFile } from '@/lib/supabase';
import { ChatInterface } from '../components/ChatInterface';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const refreshUserCredits = useCallback(async () => {
    try {
      if (user) {
        const userData = await db.getUser(user.id);
        setUserCredits(userData.credits || 20); // Default 20 credits for new users
      }
    } catch (error) {
      console.error('Error refreshing user credits:', error);
    }
  }, [user]);

  useEffect(() => {
    const initialize = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        const userData = await db.getUser(user.id);
        setUserCredits(userData.credits || 20);
        setAuthError(false);

        const urlParams = new URLSearchParams(window.location.search);
        const chatIdFromUrl = urlParams.get('chat_id');
        
        if (chatIdFromUrl) {
          const userChats = await db.getChats(user.id);
          setChats(userChats || []);
          setCurrentChatId(chatIdFromUrl);
          window.history.replaceState({}, '', '/dashboard');
        } else {
          const userChats = await db.getChats(user.id);
          setChats(userChats || []);
          if (userChats && userChats.length > 0) {
            setCurrentChatId(userChats[0].id);
          }
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [navigate, user, authLoading]);

  const createNewChat = async () => {
    try {
      setCurrentChatId(null);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error preparing new chat:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/home';
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/home';
    }
  };
  
  const handleChatUpdate = useCallback(async (newChatId = null) => {
    try {
        if (!user) return;
        const userChats = await db.getChats(user.id);
        setChats(userChats || []);
        if (newChatId && currentChatId === null) {
          setCurrentChatId(newChatId);
        }
    } catch(e) {
        console.error("Failed to update chats", e);
    }
  }, [currentChatId, user]);

  if (loading || authLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || authError) {
    navigate('/');
    return null;
  }

  return (
    <div className={`h-screen flex ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Viduto</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-4">
            <Button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm">{chat.title || 'New Chat'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-2 p-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 p-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4" />
                <span>{userCredits} credits</span>
              </div>
              
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <ChatInterface
            chatId={currentChatId}
            onChatUpdate={handleChatUpdate}
            onCreditsUpdate={refreshUserCredits}
            onNewChat={createNewChat}
            darkMode={darkMode}
          />
        </main>
      </div>
    </div>
  );
}