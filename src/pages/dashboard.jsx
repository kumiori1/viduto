@@ .. @@
 import React, { useState, useEffect, useCallback } from 'react';
 import { Menu, X, User as UserIcon, CreditCard, LogOut, Plus, MessageSquare, HelpCircle, Sun, Moon, Gift, Zap, Settings } from 'lucide-react';
 import { Link, useNavigate } from 'react-router-dom';
-import { User } from '@/api/entities';
-import { Chat } from '@/api/entities';
-import { Message } from '@/api/entities';
-import { UploadFile } from '@/api/integrations';
+import { useAuth } from '@/hooks/useAuth';
+import { db, uploadFile } from '@/lib/supabase';
 import { ChatInterface } from '../components/ChatInterface';
 import { Button } from '@/components/ui/button';
 import { HelpModal } from '../components/HelpModal';
 import { SubscriptionPage } from '../components/SubscriptionPage';
 import { WinCreditsModal } from '../components/WinCreditsModal';
 import { CreditsModal } from '../components/CreditsModal';
-import { trackSignupConversion } from '@/api/functions/trackSignupConversion';
 import { toast } from "sonner";
 import Logo from "@/components/Logo";
-import { ensureUserCredits } from '@/api/functions';
-import { createStripeCustomerPortal } from '@/api/functions';
-import { syncUserWithStripe } from '@/api/functions';

 export default function Dashboard() {
-  const [user, setUser] = useState(null);
+  const { user, loading: authLoading, signOut } = useAuth();
   const navigate = useNavigate();
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [chats, setChats] = useState([]);
@@ .. @@
   const [showWinCreditsModal, setShowWinCreditsModal] = useState(false);
   const [userCredits, setUserCredits] = useState(0);
   const [showCreditsModal, setShowCreditsModal] = useState(false);

   useEffect(() => {
@@ .. @@
   }, [darkMode]);

   useEffect(() => {
@@ .. @@
   }, []);

   useEffect(() => {
@@ .. @@
   }, []);

   const toggleDarkMode = () => {
     setDarkMode(!darkMode);
   };

   const refreshUserCredits = useCallback(async () => {
     try {
-      await syncUserWithStripe();
-      
-      const currentUser = await User.me();
-      if (currentUser) {
-        setUser(currentUser);
-        setUserCredits(currentUser.credits || 0);
-        console.log(`Credits refreshed: ${currentUser.credits}`);
+      if (user) {
+        const userData = await db.getUser(user.id);
+        setUserCredits(userData.credits || 20); // Default 20 credits for new users
+        console.log(`Credits refreshed: ${userData.credits}`);
       }
     } catch (error) {
       console.error('Error refreshing user credits:', error);
     }
-  }, []);
+  }, [user]);

   const ensureCredits = useCallback(async () => {
     try {
-      await ensureUserCredits();
+      // Ensure user has credits (implement your logic here)
       await refreshUserCredits();
     } catch (error) {
       console.error('Error ensuring user credits:', error);
@@ .. @@

   useEffect(() => {
     const initialize = async () => {
+      if (authLoading) return;
+      
+      if (!user) {
+        navigate('/');
+        return;
+      }
+
       setLoading(true);
       try {
-        await syncUserWithStripe();
-
-        const currentUser = await User.me();
-        setUser(currentUser);
-        setUserCredits(currentUser.credits || 0);
+        const userData = await db.getUser(user.id);
+        setUserCredits(userData.credits || 20);
         setAuthError(false);

-        if (currentUser.credits == null || currentUser.credits === 0) {
+        if (userData.credits == null || userData.credits === 0) {
           await ensureCredits();
         }

@@ .. @@
         if (chatIdFromUrl) {
-          const userChats = await Chat.filter({ created_by: currentUser.email }, '-updated_date');
+          const userChats = await db.getChats(user.id);
           setChats(userChats || []);
           setCurrentChatId(chatIdFromUrl);
           window.history.replaceState({}, '', '/dashboard');
@@ .. @@
               const pendingData = JSON.parse(pendingDataStr);
               sessionStorage.removeItem('pendingChatData');
               
-              const newChat = await Chat.create({ 
-                  title: 'Creating video...', 
-                  workflow_state: 'draft' 
+              const newChat = await db.createChat({ 
+                  title: 'Creating video...',
+                  user_id: user.id,
+                  status: 'active'
               });
               
               const byteCharacters = atob(pendingData.fileBase64.split(',')[1]);
@@ .. @@
               const byteArray = new Uint8Array(byteNumbers);
               const file = new File([byteArray], pendingData.fileName, { type: pendingData.fileType });

-              const { file_url } = await UploadFile({ file });
+              const { file_url } = await uploadFile(file);
               
-              await Message.create({
+              await db.createMessage({
                 chat_id: newChat.id,
                 message_type: 'user',
                 content: pendingData.prompt,
@@ .. @@
               });

-              const userChats = await Chat.filter({ created_by: currentUser.email }, '-updated_date');
+              const userChats = await db.getChats(user.id);
               setChats(userChats || []);
               setCurrentChatId(newChat.id);
               
            } else {
-              const userChats = await Chat.filter({ created_by: currentUser.email }, '-updated_date');
+              const userChats = await db.getChats(user.id);
               setChats(userChats || []);
               if (userChats && userChats.length > 0) {
@@ .. @@
       } finally {
         setLoading(false);
       }
     };
     initialize();

     const creditsInterval = setInterval(refreshUserCredits, 15000);

     return () => {
       clearInterval(creditsInterval);
     };
-  }, [navigate, refreshUserCredits, ensureCredits]);
+  }, [navigate, refreshUserCredits, ensureCredits, user, authLoading]);

   useEffect(() => {
@@ .. @@
   }, [refreshUserCredits]);


   const createNewChat = async () => {
     try {
       setCurrentChatId(null);
       setSidebarOpen(false);
       setActiveDashboardView('chat');
     } catch (error) {
       console.error('Error preparing new chat:', error);
     }
   };

   const handleSignOut = async () => {
     try {
-      await User.logout();
+      await signOut();
       window.location.href = '/home';
     } catch (error) {
       console.error('Error during logout:', error);
       window.location.href = '/home';
     }
   };
   
   const handleChatUpdate = useCallback(async (newChatId = null) => {
     try {
-        const currentUser = await User.me();
-        const userChats = await Chat.filter({ created_by: currentUser.email }, '-updated_date');
+        if (!user) return;
+        const userChats = await db.getChats(user.id);
         setChats(userChats || []);
         if (newChatId && currentChatId === null) {
           setCurrentChatId(newChatId);
@@ .. @@
     } catch(e) {
         console.error("Failed to update chats", e)
     }
-  }, [currentChatId]);
+  }, [currentChatId, user]);

   const handleManageBilling = async () => {
     try {
-      const { data } = await createStripeCustomerPortal();
-      if (data && data.url) {
-        window.open(data.url, '_blank');
-      } else {
-        toast.error('Failed to get billing portal URL.');
-      }
+      // Implement Stripe customer portal integration
+      toast.info('Billing management coming soon!');
     } catch (error) {
       console.error('Error opening billing portal:', error);
       toast.error('Failed to open billing portal');
     }
   };

-  if (loading) {
+  if (loading || authLoading) {
     return (
       <div className="h-screen bg-white flex items-center justify-center">
         <div className="text-center">
@@ .. @@
     );
   }

   if (!user || authError) {
-    return (
-      <div className="h-screen bg-white flex items-center justify-center">
-        <div className="text-center">
-          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
-          <p className="text-gray-600">Redirecting to login...</p>
-        </div>
-      </div>
-    );
+    navigate('/');
+    return null;
   }