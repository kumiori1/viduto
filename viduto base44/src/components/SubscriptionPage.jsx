import React, { useState } from 'react';
import { Check, CreditCard, HelpCircle, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const subscriptionPlans = [
  {
    name: "Starter",
    price: "$20",
    period: "/month",
    credits: 60,
    priceId: "price_1S7HjfDaWkYYoAByjBQ4K5Qr",
    features: [
      "Professional 30-second videos",
      "Product image upload",
      "AI-powered generation",
      "Email support",
      "Standard processing speed"
    ]
  },
  {
    name: "Creator",
    price: "$50",
    period: "/month", 
    credits: 150,
    priceId: "price_1S7Hk2DaWkYYoAByJ6sj8xHK",
    features: [
      "All Starter features",
      "Priority email support",
      "Advanced customization",
      "Standard processing speed"
    ]
  },
  {
    name: "Pro",
    price: "$100",
    period: "/month",
    credits: 300, 
    priceId: "price_1S7HkHDaWkYYoAByhHMb2xZV",
    popular: true,
    features: [
      "All Creator features", 
      "Priority processing queue",
      "Beta features access",
      "Priority email support",
      "Analytics dashboard"
    ]
  },
  {
    name: "Elite",
    price: "$200",
    period: "/month",
    credits: 750,
    priceId: "price_1S7HkQDaWkYYoAByeEvQ7b0E",
    features: [
      "All Pro features",
      "Dedicated support", 
      "Priority processing queue",
      "Beta features access",
      "White-label options",
      "Custom integrations"
    ]
  }
];

const faqData = [
  {
    question: "How do credits work?",
    answer: "Each video creation costs 10 credits, and revisions cost 3 credits each. Credits reset monthly with your subscription and don't roll over to the next month."
  },
  {
    question: "How long does it take to generate a video?",
    answer: "Most videos are ready in about 10-15 minutes, depending on complexity and current queue. Pro and Elite members get priority processing for faster generation times."
  },
  {
    question: "Can I change my plan anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and you'll have immediate access to your new credit allowance."
  },
  {
    question: "What happens if I run out of credits?",
    answer: "You can purchase additional credit packs for $10 (10 credits) or upgrade to a higher plan. Your account will pause video creation until you have sufficient credits."
  },
  {
    question: "Do unused credits roll over?",
    answer: "No, credits reset each month and don't carry over. This keeps our pricing simple and fair for all users."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! You can cancel your subscription anytime through the billing portal. You'll retain access to your credits until the end of your current billing period."
  }
];

export function SubscriptionPage({ user, darkMode = false, onManageBilling }) {
    const [loading, setLoading] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);

    const handleSubscribe = async (priceId, planName) => {
        setLoading(priceId);
        console.log(`Initiating subscription for ${planName} with priceId: ${priceId}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`Successfully initiated subscription for ${planName}! (This is a demo, no actual charge)`);
        setLoading(null);
    };

    const getCurrentPlan = () => {
        if (user?.subscription_status === 'active') {
            // Determine current plan based on credits
            if (user.credits === 60) return 'Starter';
            if (user.credits === 150) return 'Creator'; 
            if (user.credits === 300) return 'Pro';
            if (user.credits === 750) return 'Elite';
        }
        return 'Free';
    };

    const currentPlan = getCurrentPlan();
    const isSubscribed = user?.subscription_status === 'active';

    return (
        <div className={cn("h-full overflow-y-auto", darkMode ? "bg-gray-900" : "bg-white")}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Current Plan Status */}
                {isSubscribed && (
                    <div className={cn("rounded-2xl p-6 mb-8 border", 
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200')}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
                                    darkMode ? 'bg-blue-600' : 'bg-blue-100')}>
                                    <Zap className={cn("w-6 h-6", darkMode ? 'text-white' : 'text-blue-600')} />
                                </div>
                                <div>
                                    <h3 className={cn("text-xl font-normal", darkMode ? "text-white" : "text-gray-900")}>
                                        Current Plan: {currentPlan}
                                    </h3>
                                    <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                                        {user.credits} credits • Renews {user.subscription_period_end ? 
                                            new Date(user.subscription_period_end).toLocaleDateString() : 'monthly'}
                                    </p>
                                </div>
                            </div>
                            
                            <Button
                                onClick={onManageBilling}
                                variant="outline"
                                className={cn("flex items-center gap-2", 
                                    darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300')}
                            >
                                <CreditCard className="w-4 h-4" />
                                Manage Billing
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Page Header */}
                <div className="text-center mb-10">
                    <h2 className={cn("text-3xl font-normal tracking-tight sm:text-4xl mb-4", 
                        darkMode ? "text-white" : "text-gray-900")}>
                        {isSubscribed ? 'Manage Your Subscription' : 'Choose the right plan for you'}
                    </h2>
                    <p className={cn("text-lg leading-6", darkMode ? "text-gray-400" : "text-gray-600")}>
                        Flexible plans to match your video creation needs.
                    </p>
                </div>

                {/* Subscription Plans */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-16">
                    {subscriptionPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn("relative border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 flex flex-col",
                                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                                plan.popular ? 'border-orange-500' : '',
                                currentPlan === plan.name ? 'ring-2 ring-blue-500' : ''
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 -right-3 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-md z-10">
                                    Popular
                                </div>
                            )}
                            
                            {currentPlan === plan.name && (
                                <div className="absolute -top-3 -left-3 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-md z-10">
                                    Current Plan
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <h3 className={cn("text-xl font-normal mb-4", darkMode ? "text-white" : "text-gray-900")}>
                                    {plan.name}
                                </h3>
                                <div className={cn("text-3xl font-light mb-1", darkMode ? "text-white" : "text-gray-900")}>
                                    {plan.price}
                                    <span className={cn("text-base font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Credits</span>
                                    <span className={cn("font-normal", darkMode ? "text-gray-200" : "text-gray-900")}>{plan.credits} / mo</span>
                                </div>
                                
                                <ul className="space-y-2 pt-2 border-t" style={{ borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                            <Check className={cn("w-4 h-4 flex-shrink-0", darkMode ? "text-green-400" : "text-green-500")} />
                                            <span className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                                disabled={loading === plan.priceId || currentPlan === plan.name}
                                className={cn(
                                    "w-full text-white font-light py-3 rounded-full transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50",
                                    currentPlan === plan.name ? 
                                        "bg-blue-500 hover:bg-blue-600" : 
                                        "bg-orange-500 hover:bg-orange-500/90",
                                    loading === plan.priceId && "cursor-not-allowed"
                                )}
                            >
                                {loading === plan.priceId ? 'Processing...' : 
                                 currentPlan === plan.name ? 'Current Plan' :
                                 `Upgrade to ${plan.name}`}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* How Credits Work Section */}
                <div className={cn("rounded-2xl p-8 mb-12 border", 
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')}>
                    <h3 className={cn("text-2xl font-normal mb-6 text-center", darkMode ? "text-white" : "text-gray-900")}>
                        How Credits Work
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className={cn("w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                                darkMode ? 'bg-orange-500/20' : 'bg-orange-100')}>
                                <Zap className="w-8 h-8 text-orange-500" />
                            </div>
                            <h4 className={cn("text-lg font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>
                                10 Credits
                            </h4>
                            <p className={cn("font-light text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                                Create a new 30-second professional video from your product image
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className={cn("w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                                darkMode ? 'bg-blue-500/20' : 'bg-blue-100')}>
                                <HelpCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h4 className={cn("text-lg font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>
                                3 Credits
                            </h4>
                            <p className={cn("font-light text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                                Request revisions or modifications to your existing videos
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className={cn("w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                                darkMode ? 'bg-green-500/20' : 'bg-green-100')}>
                                <CreditCard className="w-8 h-8 text-green-500" />
                            </div>
                            <h4 className={cn("text-lg font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>
                                Monthly Reset
                            </h4>
                            <p className={cn("font-light text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                                Credits refresh every month on your billing date
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-12">
                    <h3 className={cn("text-2xl font-normal mb-8 text-center", darkMode ? "text-white" : "text-gray-900")}>
                        Frequently Asked Questions
                    </h3>
                    
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {faqData.map((faq, index) => (
                            <div
                                key={index}
                                className={cn("border rounded-2xl overflow-hidden", 
                                    darkMode ? 'border-gray-700' : 'border-gray-200')}
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className={cn("w-full p-6 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors",
                                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}
                                >
                                    <span className={cn("font-normal", darkMode ? "text-white" : "text-gray-900")}>
                                        {faq.question}
                                    </span>
                                    <HelpCircle className={cn("w-5 h-5 transition-transform",
                                        expandedFaq === index ? 'rotate-180' : '',
                                        darkMode ? "text-gray-400" : "text-gray-600")} />
                                </button>
                                
                                {expandedFaq === index && (
                                    <div className={cn("px-6 pb-6 border-t", 
                                        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50')}>
                                        <p className={cn("font-light leading-relaxed pt-4", 
                                            darkMode ? "text-gray-400" : "text-gray-600")}>
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Need Help Section */}
                <div className={cn("text-center rounded-2xl p-8 border", 
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200')}>
                    <h3 className={cn("text-xl font-normal mb-4", darkMode ? "text-white" : "text-gray-900")}>
                        Need Help?
                    </h3>
                    <p className={cn("font-light mb-6", darkMode ? "text-gray-400" : "text-gray-600")}>
                        Our support team is here to help you get the most out of Viduto
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a
                            href="mailto:support@viduto.com"
                            className={cn("px-6 py-3 rounded-full font-normal transition-colors",
                                darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')}
                        >
                            Email Support
                        </a>
                        <a
                            href="https://discord.gg/MdBr54xe"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("px-6 py-3 rounded-full font-normal border transition-colors",
                                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}
                        >
                            Join Discord
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}