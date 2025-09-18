import React, { useState, useEffect, useRef } from 'react';
import { Menu, Clock, Building, Check, X, Camera, Wand2, Edit, Upload, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { db, uploadFile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AuthModal } from '../components/AuthModal';
import { MobileMenu } from '../components/MobileMenu';
import Logo from '../components/Logo';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FaqsSection } from '../components/FaqsSection';
import { CtaSection } from '../components/CtaSection';
import { Footer } from '../components/Footer';
import { toast } from 'react-hot-toast';

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    // Track ViewContent event for homepage
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'Homepage',
        content_category: 'Landing Page'
      });
    }

    // Check for pending chat data after authentication
    const pendingData = sessionStorage.getItem('pendingChatData');
    if (pendingData && user) {
      try {
        const { prompt: pendingPrompt, file: pendingFile } = JSON.parse(pendingData);
        if (pendingPrompt) {
          setPrompt(pendingPrompt);
        }
        if (pendingFile) {
          // Convert base64 back to file
          fetch(pendingFile.data)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], pendingFile.name, { type: pendingFile.type });
              setSelectedFile(file);
            });
        }
        sessionStorage.removeItem('pendingChatData');
      } catch (error) {
        console.error("Error parsing or restoring pending chat data:", error);
        sessionStorage.removeItem('pendingChatData');
      }
    }
  }, [user]);

  const examplePrompts = [
    "Create a 30-second product demo video for our new fitness app",
    "Make a social media video showcasing our restaurant's signature dishes",
    "Generate a promotional video for our upcoming webinar on digital marketing",
    "Create an explainer video about our sustainable packaging solutions"
  ];

  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    setIsLoading(true);

    try {
      if (!user) {
        // Store the prompt and file data for after authentication
        const pendingData = {
          prompt: prompt.trim(),
          file: selectedFile ? {
            name: selectedFile.name,
            type: selectedFile.type,
            data: await fileToBase64(selectedFile)
          } : null
        };
        sessionStorage.setItem('pendingChatData', JSON.stringify(pendingData));
        setShowAuthModal(true);
      } else {
        const newChat = await db.createChat({
          title: 'Creating brief...',
          user_id: user.id,
          status: 'active'
        });

        let file_url = null;
        if (selectedFile) {
          const uploadResult = await uploadFile(selectedFile);
          file_url = uploadResult.file_url;
        }

        await db.createMessage({
          chat_id: newChat.id,
          message_type: 'user',
          content: prompt.trim(),
          metadata: file_url ? { image_url: file_url } : {}
        });

        navigate(`/dashboard?chat_id=${newChat.id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create video brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2">
              <Logo size={32} className="w-8 h-8" />
              <span className="text-2xl font-light text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
                Viduto
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link to="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                Blog
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAuthModal(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onAuthClick={() => {
          setIsMobileMenuOpen(false);
          setShowAuthModal(true);
        }}
      />

      {/* Hero Section */}
      <HeroSection 
        prompt={prompt}
        setPrompt={setPrompt}
        selectedFile={selectedFile}
        handleFileSelect={handleFileSelect}
        removeFile={removeFile}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        fileInputRef={fileInputRef}
        examplePrompts={examplePrompts}
        handleExampleClick={handleExampleClick}
      />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQs Section */}
      <FaqsSection />

      {/* CTA Section */}
      <CtaSection onGetStarted={() => setShowAuthModal(true)} />

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}