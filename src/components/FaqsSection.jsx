import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FaqsSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does AI video creation work?",
      answer: "Our AI analyzes your text description and any uploaded images to understand your vision. It then generates a professional video with appropriate visuals, transitions, and timing automatically."
    },
    {
      question: "What types of videos can I create?",
      answer: "You can create marketing videos, social media content, product demos, explainer videos, presentations, and more. Our AI adapts to different styles and formats."
    },
    {
      question: "How long does it take to generate a video?",
      answer: "Most videos are generated within 2-5 minutes, depending on length and complexity. You'll see real-time progress updates during creation."
    },
    {
      question: "Can I edit the generated videos?",
      answer: "Yes! You can request changes using simple text commands, upload new images, or ask for different styles. The AI will update your video accordingly."
    },
    {
      question: "What video formats are supported?",
      answer: "We support MP4, MOV, and other standard formats. Videos are optimized for different platforms including social media, web, and presentations."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Viduto
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}