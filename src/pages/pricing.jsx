@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { ArrowRight } from 'lucide-react';
 import { Link, useNavigate } from 'react-router-dom';
 import { PricingContent } from '../components/PricingContent';
 import { Footer } from '../components/Footer';
 import { Button } from '@/components/ui/button';
-import { User } from '@/api/entities';
+import { useAuth } from '@/hooks/useAuth';
 import { AuthModal } from '../components/AuthModal';
-import { MobileMenu } from '../components/MobileMenu'; // Added import for MobileMenu
-import { sendFacebookConversionEvent } from '@/api/functions';
+import { MobileMenu } from '../components/MobileMenu';

 export default function PricingPage() {
-  const [user, setUser] = useState(null);
+  const { user } = useAuth();
   const [showAuthModal, setShowAuthModal] = useState(false);
-  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Added state for mobile menu
+  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const navigate = useNavigate();

-  useEffect(() => {
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
+  useEffect(() => {
     // Track ViewContent event for pricing page
     if (window.fbq) {
       window.fbq('track', 'ViewContent', {
@@ .. @@
           <Link to="/home" className="flex items-center gap-2">
-            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b4aa46f5d6326ab93c3ed0/17cb8e7bc_vidutonobg.png" alt="Viduto Logo" className="w-8 h-8" />
+            <Logo size={32} className="w-8 h-8" />
             <span className="text-2xl font-light text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
               Viduto
             </span>