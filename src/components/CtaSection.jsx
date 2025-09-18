import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection({ onGetStarted }) {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Create Amazing Videos?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of creators who are already using Viduto to bring their ideas to life.
        </p>
        <Button
          onClick={onGetStarted}
          className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold inline-flex items-center gap-2"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </section>
  );
}