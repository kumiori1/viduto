import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/supabase";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { MobileMenu } from "../components/MobileMenu";
import Logo from "@/components/Logo";
import PostCard from "../components/blog/PostCard";
import { toast } from "sonner";

export default function BlogPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBlogPosts = async () => {
      setLoading(true);
      try {
        const blogPosts = await db.getBlogPosts();
        setPosts(blogPosts || []);
      } catch (error) {
        console.error('Error loading blog posts:', error);
        toast.error('Failed to load blog posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    loadBlogPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/home" className="flex items-center gap-2">
              <Logo />
              <span className="text-2xl font-light text-gray-900 tracking-tight hover:text-gray-700 transition-colors">
                Viduto
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/home" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/blog" className="text-gray-900 font-medium">
                Blog
              </Link>
              <Link to="/features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    variant="ghost"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, tips, and stories from our team
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No blog posts available at the moment.</p>
          </div>
        )}
      </main>

      <Footer />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onAuthClick={() => {
          setIsMobileMenuOpen(false);
          setShowAuthModal(true);
        }}
        onDashboardClick={() => {
          setIsMobileMenuOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}