@@ .. @@
 import React, { useEffect, useState } from "react";
 import { Link, useNavigate } from "react-router-dom";
 import { ArrowRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
-import { User } from "@/api/entities";
+import { useAuth } from "@/hooks/useAuth";
 import { Footer } from "../components/Footer";
 import { AuthModal } from "../components/AuthModal";
 import { MobileMenu } from "../components/MobileMenu";
 import Logo from "@/components/Logo";
 import PostCard from "../components/blog/PostCard";
 import { postsData } from "../components/blog/postsData";
-import { getBlogPosts } from "@/api/functions";

 export default function BlogPage() {
-  const [user, setUser] = useState(null);
+  const { user } = useAuth();
   const [showAuthModal, setShowAuthModal] = useState(false);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [posts, setPosts] = useState([]);
   const navigate = useNavigate();

-  useEffect(() => {
-    const checkUser = async () => {
-      try {
-        const currentUser = await User.me();
-        setUser(currentUser);
-      } catch (e) {
-        setUser(null);
-      }
-    };
-    checkUser();
-  }, []);

   useEffect(() => {
     const run = async () => {
       try {
-        const { data } = await getBlogPosts({});
-        if (data?.posts) setPosts(data.posts);
+        // Use static posts data for now
+        setPosts(postsData.sort((a, b) => (new Date(a.published_at) < new Date(b.published_at) ? 1 : -1)));
       } catch {
-        // fallback to static postsData if function fails
-        const { postsData } = await import("../components/blog/postsData");
         setPosts(postsData.sort((a, b) => (new Date(a.published_at) < new Date(b.published_at) ? 1 : -1)));
       }
     };