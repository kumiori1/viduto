
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqsData = [
  { question: "What is Viduto?", answer: "Viduto is an AI-powered platform that transforms your product images into professional short-form video ads by simply describing what you want. No video editing experience required." },
  { question: "Do I need video editing experience to use Viduto?", answer: "No. Our platform is designed for everyone, from complete beginners to marketing professionals. Just upload your product image and describe your vision in plain language—our AI handles all the technical video creation." },
  { question: "What types of videos can I create with Viduto?", answer: "Viduto specializes in creating engaging short-form content including: product showcase videos, social media ads, promotional clips for e-commerce, brand awareness videos, and viral-style content for platforms like TikTok, Instagram Reels, and YouTube Shorts." },
  { question: "What do I need to get started?", answer: "All you need is a product image and a creative brief. Simply upload your product photo and tell our AI what kind of video you want to create—describe the mood, setting, target audience, or specific scenes you envision." },
  { question: "How does the AI video generation process work?", answer: "Upload your product image and describe your video concept in natural language. Our AI analyzes your product, understands your creative brief, and generates original scenes that seamlessly integrate your product into dynamic, engaging video content. You can refine and iterate through simple conversation with our AI." },
  { question: "What video formats and lengths does Viduto support?", answer: "We generate videos optimized for social media platforms, typically around 30 seconds. All videos are delivered in high-quality formats suitable for Instagram, TikTok, Facebook, YouTube, and other major platforms." },
  { question: "Can I customize the generated videos?", answer: "Absolutely. After the initial generation, you can request modifications, style changes, different scenes, or completely new approaches. Our AI learns from your feedback to better match your vision." },
  { question: "Do I own the videos created with Viduto?", answer: "Yes, completely. All videos generated through Viduto belong entirely to you. You're free to use them for commercial purposes, modify them, or distribute them across any platform without restrictions." },
  { question: "Is my content secure with Viduto?", answer: "We prioritize your privacy and intellectual property. Your uploaded images and generated content are securely stored using industry-standard encryption. We never use your content for training or share it with third parties." }
];

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0 py-6">
      <button
        className="flex justify-between items-center w-full text-left text-lg font-light text-gray-900 hover:text-blue-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="pr-4">{question}</span>
        <div className="flex-shrink-0">
          {isOpen ? (
            <Minus size={20} className="text-gray-900" />
          ) : (
            <Plus size={20} className="text-gray-900" />
          )}
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <p className="mt-4 text-gray-700 leading-relaxed font-light">
          {answer}
        </p>
      </div>
    </div>
  );
};

export function FaqsSection() {
  return (
    <section className="bg-white py-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 font-light">
            Everything you need to know about Viduto
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {faqsData.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
