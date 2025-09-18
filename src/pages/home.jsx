@@ .. @@
 import React, { useState, useEffect, useRef } from 'react';
 import { Menu, Clock, Building, Check, X, Camera, Wand2, Edit, Upload, Play } from 'lucide-react';
 import { Link, useNavigate } from 'react-router-dom';
-import { User } from '@/api/entities';
+import { useAuth } from '@/hooks/useAuth';
+import { db, uploadFile } from '@/lib/supabase';
 import { Button } from '@/components/ui/button';
 import { AuthModal } from '../components/AuthModal';
 import { MobileMenu } from '../components/MobileMenu';
@@ .. @@
 import { TestimonialsSection } from '../components/TestimonialsSection';
 import { FaqsSection } from '../components/FaqsSection';
 import { CtaSection } from '../components/CtaSection';
 import { Footer } from '../components/Footer';
-import { sendFacebookConversionEvent } from '@/api/functions';
-import { Toaster, toast } from 'react-hot-toast';
+import { toast } from 'react-hot-toast';

 // Helper function to convert file to base64
@@ .. @@

 export default function Home() {
-  const [user, setUser] = useState(null);
+  const { user } = useAuth();
   const navigate = useNavigate();
   const [prompt, setPrompt] = useState('');
@@ .. @@
   };

   useEffect(() => {
-    const checkUser = async () => {
-      try {
-        const currentUser = await User.me();
-        setUser(currentUser);
-      } catch (e) {
-        setUser(null);
-      }
-    };
-    checkUser();
-
     // Track ViewContent event for homepage
     if (window.fbq) {
       window.fbq('track', 'ViewContent', {
@@ .. @@
         }
       } catch (error) {
         console.error("Error parsing or restoring pending chat data:", error);
         sessionStorage.removeItem('pendingChatData');
       }
     }
-  }, []);
+  }, [user]);

   const examplePrompts = [
@@ .. @@
         sessionStorage.setItem('pendingChatData', JSON.stringify(pendingData));
         setShowAuthModal(true);
       } else {
-        const { Chat } = await import('@/api/entities');
-        const { Message } = await import('@/api/entities');
-        const { UploadFile } = await import('@/api/integrations');
-
-        const newChat = await Chat.create({
+        const newChat = await db.createChat({
           title: 'Creating brief...',
-          status: 'draft',
-          workflow_state: 'draft'
+          user_id: user.id,
+          status: 'active'
         });

-        const { file_url } = await UploadFile({ file: selectedFile });
+        const { file_url } = await uploadFile(selectedFile);

-        await Message.create({
+        await db.createMessage({
           chat_id: newChat.id,
           message_type: 'user',
           content: prompt.trim(),
@@ .. @@
   return (
     <div className="min-h-screen bg-white" style={{ '--header-bg': 'rgba(255, 255, 255, 0.7)', '--text-dark': '#333', '--text-medium': '#666', '--text-light': '#999', '--accent-orange': '#F97316', '--accent-primary': '#60A5FA', '--accent-secondary': '#818CF8', '--surface-elevated': '#F3F4F6', '--input-border': '#E5E7EB', '--accent-success': '#10B981' }}>
-      <Toaster position="top-center" reverseOrder={false} />
       
       {/* Header */}
@@ .. @@
           <Link to="/home" className="flex items-center gap-2">
-            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b4aa46f5d6326ab93c3ed0/17cb8e7bc_vidutonobg.png" alt="Viduto Logo" className="w-8 h-8" />
+            <Logo size={32} className="w-8 h-8" />
             <span className="text-2xl font-light text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
               Viduto
             </span>