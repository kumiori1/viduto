
import React, { useState, useEffect } from 'react';
import { Loader2, Clock, X } from 'lucide-react'; // Zap removed as it's no longer used
import { Button } from '@/components/ui/button';

export default function ProductionProgress({ videoId, startedAt, chatId, darkMode = false, onCancel, isCancelling = false }) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isOverTime, setIsOverTime] = useState(false);

    // Check if this is a revision based on video_id
    const isRevision = videoId && videoId.startsWith('revision_');
    const estimatedTotalTimeMinutes = isRevision ? 5 : 12; // 5 minutes for revisions, 12 for initial videos
    const estimatedTotalSeconds = estimatedTotalTimeMinutes * 60;

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startedAt) / 1000);
            setElapsedSeconds(elapsed);
            setIsOverTime(elapsed > estimatedTotalSeconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt, estimatedTotalSeconds]); // Added estimatedTotalSeconds to dependencies

    const progress = Math.min((elapsedSeconds / estimatedTotalSeconds) * 100, 100);
    const remainingSeconds = Math.max(estimatedTotalSeconds - elapsedSeconds, 0);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsDisplay = remainingSeconds % 60;

    return (
        <div className={`rounded-2xl p-6 border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                    }`}>
                        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    </div>
                    <div>
                        <h3 className={`font-normal ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isRevision ? 'Creating Revision' : 'Creating Your Video'}
                        </h3>
                        <p className={`text-sm font-light ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Estimated: {estimatedTotalTimeMinutes} minutes
                        </p>
                    </div>
                </div>
                
                <Button
                    onClick={onCancel}
                    disabled={isCancelling}
                    variant="outline"
                    size="sm"
                    className={`${
                        darkMode 
                            ? 'border-red-600 text-red-400 hover:bg-red-900/20' 
                            : 'border-red-300 text-red-600 hover:bg-red-50'
                    } ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isCancelling ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                        </>
                    ) : (
                        <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </>
                    )}
                </Button>
            </div>

            {/* Progress Bar */}
            <div className={`w-full rounded-full h-3 mb-4 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
                <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                        isOverTime ? 'bg-amber-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-light ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} elapsed
                    </span>
                </div>
                
                {!isOverTime ? (
                    <span className={`font-light ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ~{remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')} remaining
                    </span>
                ) : (
                    <span className={`font-light ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        Taking longer than expected...
                    </span>
                )}
            </div>

            <div className={`mt-4 pt-4 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-light ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {isRevision 
                        ? 'Your revision is being processed with priority. You\'ll be notified when it\'s ready.' 
                        : 'Your video is being created with AI magic. You\'ll be notified when it\'s ready.'
                    }
                </p>
            </div>
        </div>
    );
}
