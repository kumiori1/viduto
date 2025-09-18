import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { X } from 'lucide-react';
import { toast } from "sonner";
import Logo from "@/components/Logo";

export const AuthModal = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        
        try {
            // Track login attempt
            if (window.fbq) {
                window.fbq('track', 'InitiateCheckout');
            }
            
            // Use Supabase Google OAuth login method
            await signIn();
        } catch (error) {
            console.error('Google login failed:', error);
            toast.error('Login failed. Please try again.');
            setIsLoading(false);
        }
    };
};