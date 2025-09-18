import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
  }
  )
}