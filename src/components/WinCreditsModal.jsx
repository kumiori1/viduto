import React, { useState } from 'react';
import { X, Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const WinCreditsModal = ({ isOpen, onClose, onCreditsWon, darkMode = false }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleShareTwitter = () => {
    const text = "Just discovered @Viduto - amazing AI video creation tool! 🎥✨ #AI #VideoCreation";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    // Simulate credit reward
    setTimeout(() => {
      toast.success('Thanks for sharing! 5 credits added to your account.');
      if (onCreditsWon) onCreditsWon();
      onClose();
    }, 2000);
  };

  const handleShareLinkedIn = () => {
    const text = "Just discovered Viduto - an amazing AI video creation tool that's revolutionizing content creation!";
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://viduto.com')}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    // Simulate credit reward
    setTimeout(() => {
      toast.success('Thanks for sharing! 5 credits added to your account.');
      if (onCreditsWon) onCreditsWon();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Win Free Credits!</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Share Viduto on social media and earn 5 free credits! Help us spread the word about AI video creation.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleShareTwitter}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={loading}
          >
            <ExternalLink className="w-4 h-4" />
            Share on Twitter (+5 credits)
          </Button>

          <Button
            onClick={handleShareLinkedIn}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
            disabled={loading}
          >
            <ExternalLink className="w-4 h-4" />
            Share on LinkedIn (+5 credits)
          </Button>
        </div>

        <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Credits will be added to your account after sharing
        </p>
      </div>
    </div>
  );
};