import React from 'react';
import { Play, Star } from 'lucide-react';

export function ProductShowcaseSection({ onAuthRequired }) {
  const showcaseItems = [
    {
      title: "Product Demo Videos",
      description: "Transform static product images into engaging demo videos",
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
    },
    {
      title: "Social Media Content",
      description: "Create viral-ready content for all your social platforms",
      image: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800"
    },
    {
      title: "Marketing Campaigns",
      description: "Professional marketing videos that convert viewers to customers",
      image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            See what's possible with{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AI video creation</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            From product demos to viral social content, create professional videos in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {showcaseItems.map((item, index) => (
            <div key={index} className="group cursor-pointer" onClick={onAuthRequired}>
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 font-light">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-gray-600 font-light">4.9/5 from 1,200+ creators</span>
          </div>
          <p className="text-gray-500 font-light">
            "The easiest way to create professional product videos. Game changer for our marketing!"
          </p>
        </div>
      </div>
    </section>
  );
}