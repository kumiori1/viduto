import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { MobileMenu } from "../components/MobileMenu";
import Logo from "@/components/Logo";
import ReactMarkdown from "react-markdown";
import { postsData } from "../components/blog/postsData";
import { Loader2 } from "lucide-react";

export default function BlogPost() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Use static posts data
        setPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch blog posts from backend, falling back to local data:", error);
        setPosts(postsData);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);
}