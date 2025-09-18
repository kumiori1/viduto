import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';
import { toast } from 'sonner';

const tiers = [
  {
    name: 'Free',
    id: 'free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '20 free credits',
      'HD quality videos',
      'Basic templates',
      'Email support'
    ],
    cta: 'Get Started Free',
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    price: 29,
    priceId: 'price_pro_monthly',
    description: 'Best for content creators',
    features: [
      '500 credits per month',
      '4K quality videos',
      'Premium templates',
      'Priority support',
      'Custom branding',
      'Analytics dashboard'
    ],
    cta: 'Start Pro Plan',
    mostPopular: true,
  },
  {
    name: 'Business',
    id: 'business',
    price: 99,
    priceId: 'price_business_monthly',
    description: 'For teams and businesses',
    features: [
      '2000 credits per month',
      '4K quality videos',
      'All premium templates',
      '24/7 priority support',
      'Custom branding',
      'Advanced analytics',
      'Team collaboration',
      'API access'
    ],
    cta: 'Start Business Plan',
    mostPopular: false,
  },
];

export function PricingContent({ isSubscriptionView = false, darkMode = false }) {
  const [loading, setLoading] = useState(null);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(100);
  const navigate = useNavigate();

  const handleSubscribe = async (priceId, planName) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(priceId);
    
    try {
      // כאן תוסיף את האינטגרציה עם Stripe
      toast.success(`מתחיל תהליך רכישה עבור ${planName}! (מצב דמו)`);
      // Simulate success
      setTimeout(() => {
        toast.success('התשלום הושלם בהצלחה!');
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('שגיאה בתהליך התשלום');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading('credits');
    
    try {
      // כאן תוסיף את האינטגרציה עם Stripe לרכישת קרדיטים
      toast.success(`מתחיל תהליך רכישה של ${creditAmount} קרדיטים! (מצב דמו)`);
      setTimeout(() => {
        toast.success('הקרדיטים נוספו לחשבון שלך!');
      }, 2000);
    } catch (error) {
      console.error('Error buying credits:', error);
      toast.error('שגיאה ברכישת קרדיטים');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative rounded-2xl p-8 shadow-lg',
                tier.mostPopular
                  ? 'border-2 border-orange-500 bg-orange-50'
                  : darkMode
                  ? 'border border-gray-700 bg-gray-800'
                  : 'border border-gray-200 bg-white'
              )}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    הכי פופולרי
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tier.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className={`text-lg ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      /חודש
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => tier.price === 0 ? (user ? navigate('/dashboard') : setShowAuthModal(true)) : handleSubscribe(tier.priceId, tier.name)}
                disabled={loading === tier.priceId}
                className={cn(
                  'w-full py-3',
                  tier.mostPopular
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                )}
              >
                {loading === tier.priceId ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    טוען...
                  </div>
                ) : (
                  tier.cta
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        <div className={`border-t pt-16 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              או קנה קרדיטים בנפרד
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              גמישות מלאה - שלם רק על מה שאתה משתמש
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className={`rounded-2xl p-8 shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  חבילת קרדיטים
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  בחר כמה קרדיטים אתה רוצה
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCreditAmount(Math.max(10, creditAmount - 10))}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {creditAmount}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      קרדיטים
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setCreditAmount(creditAmount + 10)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'} hover:opacity-80`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${(creditAmount * 0.1).toFixed(2)}
                  </span>
                  <span className={`text-sm ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ($0.10 לקרדיט)
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBuyCredits}
                disabled={loading === 'credits'}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
              >
                {loading === 'credits' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    טוען...
                  </div>
                ) : (
                  'קנה קרדיטים'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          navigate('/dashboard');
        }}
      />
    </section>
  );
}