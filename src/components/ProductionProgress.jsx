import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductionProgress({ 
  videoId, 
  startedAt, 
  chatId, 
  darkMode = false, 
  onCancel, 
  isCancelling = false 
}) {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000);
      setTimeElapsed(elapsed);
      
      // Simulate progress (0-100% over ~10 seconds)
      const simulatedProgress = Math.min((elapsed / 10) * 100, 95);
      setProgress(simulatedProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 rounded-2xl border ${
      darkMode 
        ? 'bg-gray-800 border-gray-700 text-gray-100' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="font-medium">Creating your video...</span>
        </div>
        <Button
          onClick={onCancel}
          disabled={isCancelling}
          variant="ghost"
          size="sm"
          className={`text-gray-400 hover:text-gray-600 ${darkMode ? 'hover:text-gray-200' : ''}`}
        >
          {isCancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{Math.round(progress)}% complete</span>
          <span>{formatTime(timeElapsed)} elapsed</span>
        </div>
      </div>
      
      <p className={`text-sm mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        This usually takes 1-3 minutes. You'll be notified when it's ready!
      </p>
    </div>
  );
}