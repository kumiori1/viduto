import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/supabase";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { MobileMenu } from "../components/MobileMenu";
import Logo from "@/components/Logo";
import ReactMarkdown from "react-markdown";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function BlogPost() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const postId = searchParams.get('id');
  const postSlug = searchParams.get('slug');

  useEffect(() => {
    const loadBlogPost = async () => {
      setIsLoading(true);
      try {
        let blogPost = null;
        
        if (postId) {
          blogPost = await db.getBlogPostById(postId);
        } else if (postSlug) {
          blogPost = await db.getBlogPostBySlug(postSlug);
        } else {
          throw new Error('No post ID or slug provided');
        }
        
        setPost(blogPost);
      } catch (error) {
        console.error("Error loading blog post:", error);
        toast.error('Failed to load blog post');
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (postId || postSlug) {
      loadBlogPost();
    } else {
      setIsLoading(false);
    }
  }, [postId, postSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
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
              </nav>

              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <Button onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                ) : (
                  <Button onClick={() => setShowAuthModal(true)}>
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Blog Post Not Found
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog">
              <Button className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>

        <Footer />
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

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
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  Get Started
                </Button>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
            />
          )}
          
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <span>By {post.author}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </div>

        <article className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
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