import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Logo />
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/blog" className="text-gray-900 font-medium">
                Blog
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user.name}</span>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.reload();
                    }}
                    variant="outline"
                  >
                    Logout
                  </Button>
                </div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      
      {isMobileMenuOpen && (
        <MobileMenu
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
          onAuthClick={() => {
            setIsMobileMenuOpen(false);
            setShowAuthModal(true);
          }}
        />
      )}
    </div>
  );
}