import React from 'react';
import { Upload, X, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection({ 
  prompt, 
  setPrompt, 
  selectedFile, 
  handleFileSelect, 
  removeFile, 
  handleSubmit, 
  isLoading, 
  fileInputRef,
  examplePrompts,
  handleExampleClick 
}) {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Create Professional Videos with AI
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Transform your ideas into stunning videos in minutes. Just describe what you want, and our AI will create it for you.
        </p>
        
        {/* Video Creation Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                disabled={isLoading}
              />
            </div>
            
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Create Video
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Example Prompts */}
        <div className="text-left max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Try these examples:</h3>
          <div className="grid gap-3">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 hover:text-blue-600"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}