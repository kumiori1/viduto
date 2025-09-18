@@ .. @@
 import React, { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Check, Plus, Minus } from 'lucide-react';
 import { cn } from '@/lib/utils';
-import { User } from '@/api/entities';
+import { useAuth } from '@/hooks/useAuth';
 import { useNavigate } from 'react-router-dom';
 import { AuthModal } from '@/components/AuthModal';
-import { sendFacebookConversionEvent } from '@/api/functions';
-import { useToast } from '@/components/ui/use-toast'; // Added toast import
+import { toast } from 'react-hot-toast';

 const tiers = [
@@ .. @@

 export function PricingContent({ isSubscriptionView = false, darkMode = false }) {
   const [loading, setLoading] = useState(null);
-  const [user, setUser] = useState(null);
+  const { user } = useAuth();
   const [showAuthModal, setShowAuthModal] = useState(false);
   const [creditAmount, setCreditAmount] = useState(10);
   const navigate = useNavigate();
-  const { toast } = useToast(); // Initialize toast

-  React.useEffect(() => {
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

   const handleSubscribe = async (priceId, planName) => {
     if (!user) {
@@ .. @@
       });
     }

-    // Track server-side Initiate Checkout event
-    sendFacebookConversionEvent({
-      eventName: 'InitiateCheckout',
-      value: planValue,
-      currency: 'USD',
-      customData: {
-        content_name: planName,
-        content_category: 'subscription'
-      }
-    }).catch(e => console.error('Failed to send InitiateCheckout event:', e));
-
-    setLoading(priceId); // Use priceId for loading state
+    setLoading(priceId);
     
     try {
-        const { createStripeCheckoutSession } = await import('@/api/functions');
-        
-        const response = await createStripeCheckoutSession({ priceId, mode: 'subscription' });
-        
-        if (response.data?.url) {
-            window.location.href = response.data.url;
-        } else {
-            throw new Error('No checkout URL returned');
-        }
-
+        // Implement Stripe checkout integration
+        toast.success(`Subscription for ${planName} initiated! (Demo mode)`);
     } catch (error) {
         console.error('Error creating checkout session:', error);
-        toast.error('Failed to start checkout process'); // Use toast.error
+        toast.error('Failed to start checkout process');
     } finally {
         setLoading(null);
     }
@@ .. @@
       });
     }

-    // Track server-side Initiate Checkout event
-    sendFacebookConversionEvent({
-      eventName: 'InitiateCheckout',
-      value: calculatedValue, // Use calculatedValue
-      currency: 'USD',
-      customData: {
-        content_name: 'Credit Pack',
-        content_category: 'credits'
-      }
-    }).catch(e => console.error('Failed to send InitiateCheckout event:', e));
-
-    setLoading('Credit Pack'); // Using 'Credit Pack' for loading state
+    setLoading('Credit Pack');
     
     try {
-        const { createStripeCheckoutSession } = await import('@/api/functions');
-        
-        const response = await createStripeCheckoutSession({ 
-          priceId: oneTimeCreditPriceId, 
-          mode: 'payment',
-          quantity: quantity 
-        });
-        
-        if (response.data?.url) {
-            window.location.href = response.data.url;
-        } else {
-            throw new Error('No checkout URL returned');
-        }
-
+        // Implement credit pack purchase
+        toast.success(`Credit pack purchase initiated! (Demo mode)`);
     } catch (error) {
         console.error('Error creating checkout session:', error);
-        toast.error('Failed to start checkout process'); // Use toast.error
+        toast.error('Failed to start checkout process');
     } finally {
         setLoading(null);
     }
@@ .. @@

   const handleManageSubscription = async () => {
     setLoading('manage');
     try {
-      const { createStripeCustomerPortal } = await import('@/api/functions');
-      
-      const response = await createStripeCustomerPortal();
-      
-      if (response.data?.url) {
-        window.location.href = response.data.url;
-      } else {
-        throw new Error('No portal URL returned');
-      }
+      // Implement customer portal
+      toast.info('Subscription management coming soon!');
     } catch (error) {
       console.error('Error accessing customer portal:', error);
-      toast.error('Error accessing subscription management. Please try again.'); // Use toast.error
+      toast.error('Error accessing subscription management. Please try again.');
     } finally {
         setLoading(null);
     }