import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './pages/Layout';
import Home from './pages/home';
import Features from './pages/features';
import Pricing from './pages/pricing';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Dashboard from './pages/dashboard';
import Enterprise from './pages/enterprise';
import Terms from './pages/terms';
import Privacy from './pages/privacy';

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={
            <Layout currentPageName="home">
              <Home />
            </Layout>
          } />
          <Route path="/features" element={
            <Layout currentPageName="features">
              <Features />
            </Layout>
          } />
          <Route path="/pricing" element={
            <Layout currentPageName="pricing">
              <Pricing />
            </Layout>
          } />
          <Route path="/blog" element={
            <Layout currentPageName="blog">
              <Blog />
            </Layout>
          } />
          <Route path="/blogpost" element={
            <Layout currentPageName="blogpost">
              <BlogPost />
            </Layout>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/enterprise" element={
            <Layout currentPageName="enterprise">
              <Enterprise />
            </Layout>
          } />
          <Route path="/terms" element={
            <Layout currentPageName="terms">
              <Terms />
            </Layout>
          } />
          <Route path="/privacy" element={
            <Layout currentPageName="privacy">
              <Privacy />
            </Layout>
          } />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}