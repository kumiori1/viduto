import React, { useState, useEffect } from 'react';
import { Camera, Clock, MessageSquare, Wand2, TrendingUp, DollarSign, FileText, CreditCard, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '../components/AuthModal';
import { MobileMenu } from '../components/MobileMenu';
import Logo from "@/components/Logo";

// Update feature copy to clarify 3-credit revisions

export default function FeaturesPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAuthRequired = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/dashboard');
    }
  };
}