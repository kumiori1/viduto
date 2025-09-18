import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function MobileMenu({ isOpen, onClose, user, onAuthClick, onDashboardClick }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-4">
          <Link
            to="/home"
            className="block py-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Home
          </Link>
          <Link
            to="/features"
            className="block py-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="block py-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            className="block py-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Blog
          </Link>
          
          <div className="pt-4 border-t space-y-2">
            {user ? (
              <Button
                onClick={() => {
                  onClose();
                  onDashboardClick();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    onClose();
                    onAuthClick();
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    onAuthClick();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}