@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { Camera, Clock, MessageSquare, Wand2, TrendingUp, DollarSign, FileText, CreditCard, ArrowRight } from 'lucide-react';
 import { Link, useNavigate } from 'react-router-dom';
 import { Footer } from '../components/Footer';
 import { Button } from '@/components/ui/button';
-import { User } from '@/api/entities';
+import { useAuth } from '@/hooks/useAuth';
 import { AuthModal } from '../components/AuthModal';
-import { MobileMenu } from '../components/MobileMenu'; // Import MobileMenu
+import { MobileMenu } from '../components/MobileMenu';
 import Logo from "@/components/Logo";

 // Update feature copy to clarify 3-credit revisions
@@ .. @@

 export default function FeaturesPage() {
-  const [user, setUser] = useState(null);
-  const [showAuthModal, setShowAuthModal] = useState(false); // State for AuthModal
-  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for MobileMenu
+  const { user } = useAuth();
+  const [showAuthModal, setShowAuthModal] = useState(false);
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
-  }, []);

   const handleAuthRequired = () => {
     if (!user) {
-      setShowAuthModal(true); // Show AuthModal if user is not logged in
+      setShowAuthModal(true);
     } else {
       navigate('/dashboard');
     }