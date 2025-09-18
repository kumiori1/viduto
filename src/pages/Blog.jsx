import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { MobileMenu } from "../components/MobileMenu";
import Logo from "@/components/Logo";
import PostCard from "../components/blog/PostCard";
import { postsData } from "../components/blog/postsData";

export default function BlogPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        // Use static posts data for now
        setPosts(postsData.sort((a, b) => (new Date(a.published_at) < new Date(b.published_at) ? 1 : -1)));
      } catch {
        setPosts(postsData.sort((a, b) => (new Date(a.published_at) < new Date(b.published_at) ? 1 : -1)));
      }
    };
    run();
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

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
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