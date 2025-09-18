import React from 'react';
import { Wand2, Clock, Camera, Edit } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Wand2,
      title: "AI-Powered Creation",
      description: "Advanced AI understands your vision and creates professional videos automatically."
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Generate high-quality videos in minutes, not hours or days."
    },
    {
      icon: Camera,
      title: "Professional Quality",
      description: "Studio-quality output with perfect timing, transitions, and effects."
    },
    {
      icon: Edit,
      title: "Easy Editing",
      description: "Make changes with simple text commands. No complex editing skills required."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Viduto?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The most advanced AI video creation platform, designed for creators who demand excellence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}