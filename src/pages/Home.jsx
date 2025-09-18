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
    "Create a dynamic 30-second ad for my running shoes showcasing speed and performance",
    "Make a luxurious product showcase for my jewelry with elegant transitions",
    "Generate an energetic ad for my fitness supplement highlighting results",
    "Produce a clean and modern demo for my new tech gadget, focusing on ease of use"
  ];

  const examplePromptsPreview = [
    "Running shoes ad",
    "Jewelry showcase", 
    "Fitness supplement",
    "Tech product demo"
  ];

  const handleExampleClick = (example) => {
    const index = examplePromptsPreview.indexOf(example);
    if (index !== -1 && index < examplePrompts.length) {
      setPrompt(examplePrompts[index]);
    }
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
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-4 bg-gradient-to-br from-blue-100 via-purple-100 to-orange-100">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mt-4 md:mt-12 mb-4 mx-auto font-medium sm:text-5xl md:text-6xl leading-tight tracking-tight md:mb-6 md:whitespace-nowrap w-fit">
            Create viral videos <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">with your product.</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed font-light md:whitespace-nowrap">
            Use one image of your product to create
            <br className="md:hidden" />
            short-form videos by chatting with AI.
          </p>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl p-2 sm:p-4 w-full mx-auto shadow-lg md:shadow-xl hover:shadow-2xl transition-shadow duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(129, 140, 248, 0.2)',
              boxShadow: '0 12px 30px rgba(129, 140, 248, 0.22), 0 8px 20px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-3">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Let's start vibe clipping..."
                  className="h-28 sm:h-32 md:h-24 w-full bg-transparent text-gray-800 placeholder-gray-500 resize-none border-none outline-none text-sm md:text-base leading-relaxed font-light pr-16"
                />

                <div className="absolute bottom-2 right-2">
                  <input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className={`w-10 h-10 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${
                      !prompt.trim() 
                        ? 'bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:hover:scale-100'
                        : !selectedFile
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : !prompt.trim() ? (
                      <Edit size={16} className="text-gray-600" />
                    ) : !selectedFile ? (
                      <Upload size={16} className="text-white" />
                    ) : (
                      <Play size={16} className="text-white" />
                    )}
                  </button>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-2 text-xs text-gray-700 font-light mt-4 mb-3">
              <span>Not sure where to start?</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {examplePromptsPreview.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1 text-xs md:px-4 md:py-2 md:text-sm bg-transparent backdrop-blur-sm border-white/40 rounded-full text-gray-800 hover:bg-white/20 transition-colors shadow-sm font-normal"
                >
                  {example}
                </Button>
              ))}
            </div>
          </form>
        </div>

        <div className="mt-16 w-full max-w-4xl mx-auto flex justify-center">
          <div className="w-full max-w-sm md:hidden bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl p-3 shadow-lg">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">x100</div>
                <div className="text-sm text-gray-600 font-light">Faster</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">x10</div>
                <div className="text-sm text-gray-600 font-light">Cheaper</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">∞</div>
                <div className="text-sm text-gray-600 font-light">Easier</div>
              </div>
            </div>
          </div>

          <div className="hidden md:inline-flex flex-row items-center gap-8 bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl px-6 py-4 shadow-lg">
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="font-semibold text-gray-900 text-xl">x100</span>
              <span className="text-gray-600 font-light text-base">Faster</span>
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="flex flex-col items-center gap-1 px-2">
              <span className="font-semibold text-gray-900 text-xl">x10</span>
              <span className="text-gray-600 font-light text-base">Cheaper</span>
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <div className="flex flex-col items-center gap-1 px-2">
              <span className="font-semibold text-gray-900 text-xl">∞</span>
              <span className="text-gray-600 font-light text-base">Easier</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <section className="bg-gray-900 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight">
                Pricing plans for{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">every need</span>
              </h2>
              <p className="text-xl text-gray-400 font-light mb-8">Scale as you go with plans designed to match your growth.</p>
            </div>
            <div className="lg:w-1/2 grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-1">
                <div className="bg-white rounded-2xl p-8 flex flex-col h-full">
                  <h3 className="text-2xl font-light text-gray-900 mb-6">Start for free.</h3>
                  <div className="mb-8 flex-grow">
                    <ul className="space-y-3">
                      {["20 free credits", "HD quality output", "Commercial usage rights", "Email support"].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <Check size={16} className="text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 font-light">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button onClick={() => setShowAuthModal(true)} className="w-full bg-black text-white font-normal py-3 rounded-full hover:bg-gray-800 transition-all duration-200">Get Started</Button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-1 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-black text-xs font-normal px-3 py-1 rounded-full">MOST POPULAR</span>
                </div>
                <div className="bg-white rounded-2xl p-8 flex flex-col h-full">
                  <h3 className="text-2xl font-light text-gray-900 mb-2">Paid plans from</h3>
                  <div className="text-4xl font-normal text-gray-900 mb-6">$20<span className="text-lg text-gray-600 font-light">/mo</span></div>
                  <div className="mb-8 flex-grow"><p className="text-gray-700 font-light">Upgrade for more videos, flexibility, and support.</p></div>
                  <Link to="/pricing" className="block w-full bg-gradient-to-r from-blue-400 to-purple-500 text-black font-normal py-3 rounded-full text-center hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200">See all plans</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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