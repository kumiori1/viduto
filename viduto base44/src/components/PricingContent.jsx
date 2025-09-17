
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';
import { sendFacebookConversionEvent } from '@/api/functions';
import { useToast } from '@/components/ui/use-toast'; // Added toast import

const tiers = [
  {
    name: "Starter",
    price: "$20",
    period: "/month",
    credits: 60,
    priceId: "price_1S7HjfDaWkYYoAByjBQ4K5Qr",
    features: [
      "60 video credits monthly", // Re-added this for consistent display with original structure
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
      "150 video credits monthly", // Re-added this for consistent display with original structure
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
      "300 video credits monthly", // Re-added this for consistent display with original structure
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
      "750 video credits monthly", // Re-added this for consistent display with original structure
      "All Pro features",
      "Dedicated support", 
      "Priority processing queue",
      "Beta features access",
      "White-label options",
      "Custom integrations"
    ]
  }
];

const oneTimeCreditPriceId = 'price_1RxTVjDaWkYYoAByvUfEwWY9';
const oneTimeCreditUnitCost = 10;
const oneTimeCreditUnitAmount = 10;


export function PricingContent({ isSubscriptionView = false, darkMode = false }) {
  const [loading, setLoading] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(10);
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize toast

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const handleSubscribe = async (priceId, planName) => {
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    
    // Find the tier to get the correct price value
    const tier = tiers.find(t => t.priceId === priceId);
    const planValue = tier ? parseFloat(tier.price.replace('$', '')) : 0;

    // Facebook Pixel tracking for subscription initiation (client-side)
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: planName,
        content_category: 'subscription',
        value: planValue,
        currency: 'USD'
      });
    }

    // Track server-side Initiate Checkout event
    sendFacebookConversionEvent({
      eventName: 'InitiateCheckout',
      value: planValue,
      currency: 'USD',
      customData: {
        content_name: planName,
        content_category: 'subscription'
      }
    }).catch(e => console.error('Failed to send InitiateCheckout event:', e));

    setLoading(priceId); // Use priceId for loading state
    
    try {
        const { createStripeCheckoutSession } = await import('@/api/functions');
        
        const response = await createStripeCheckoutSession({ priceId, mode: 'subscription' });
        
        if (response.data?.url) {
            window.location.href = response.data.url;
        } else {
            throw new Error('No checkout URL returned');
        }

    } catch (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Failed to start checkout process'); // Use toast.error
    } finally {
        setLoading(null);
    }
  };

  const handleBuyCreditPack = async (amount) => {
    if (!user) {
        setShowAuthModal(true);
        return;
    }

    const quantity = amount / oneTimeCreditUnitAmount;
    const calculatedValue = quantity * oneTimeCreditUnitCost;

    // Facebook Pixel tracking for credit pack purchase initiation (client-side)
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'Credit Pack',
        content_category: 'credits',
        value: calculatedValue, // Use calculatedValue
        currency: 'USD'
      });
    }

    // Track server-side Initiate Checkout event
    sendFacebookConversionEvent({
      eventName: 'InitiateCheckout',
      value: calculatedValue, // Use calculatedValue
      currency: 'USD',
      customData: {
        content_name: 'Credit Pack',
        content_category: 'credits'
      }
    }).catch(e => console.error('Failed to send InitiateCheckout event:', e));

    setLoading('Credit Pack'); // Using 'Credit Pack' for loading state
    
    try {
        const { createStripeCheckoutSession } = await import('@/api/functions');
        
        const response = await createStripeCheckoutSession({ 
          priceId: oneTimeCreditPriceId, 
          mode: 'payment',
          quantity: quantity 
        });
        
        if (response.data?.url) {
            window.location.href = response.data.url;
        } else {
            throw new Error('No checkout URL returned');
        }

    } catch (error) {
        console.error('Error creating checkout session:', error);
        toast.error('Failed to start checkout process'); // Use toast.error
    } finally {
        setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');
    try {
      const { createStripeCustomerPortal } = await import('@/api/functions');
      
      const response = await createStripeCustomerPortal();
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast.error('Error accessing subscription management. Please try again.'); // Use toast.error
    } finally {
        setLoading(null);
    }
  };

  const handleCreditChange = (amount) => {
      setCreditAmount(prev => {
          const newValue = prev + amount;
          return Math.max(10, newValue);
      });
  }

  return (
    <div className={cn("py-12", darkMode ? "bg-gray-900" : "bg-white")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className={cn("text-4xl md:text-5xl font-light mb-4", darkMode ? "text-white" : "text-gray-900")}>
            {isSubscriptionView ? "Upgrade Your Plan" : "Flexible plans for everyone"}
          </h2>
          <p className={cn("text-xl font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
            {isSubscriptionView ? "Unlock more credits and advanced features." : "Choose the plan that's right for you."}
          </p>
        </div>
      
        {/* Mobile: Horizontal scrolling cards */}
        <div className="md:hidden mb-8">
          <div className="flex gap-4 overflow-x-auto pt-4 pb-4 px-4 -mx-4 snap-x">
            {tiers.map((product) => (
              <div
                key={product.name}
                className={cn(`relative rounded-3xl p-4 hover:shadow-xl transition-all duration-300 flex flex-col min-w-[280px] max-w-[280px] flex-shrink-0 snap-center`,
                  darkMode ? 'bg-gray-800 border-2 border-gray-700 hover:border-blue-500' : 'bg-slate-50 border-2 border-blue-200 hover:border-blue-200'
                )}
              >
                {product.popular && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-md z-10">
                    Popular
                  </div>
                )}
                {/* Header Section */}
                <div className="text-center mb-3">
                  <h3 className={cn("text-xl font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>{product.name}</h3>
                  
                  {/* Price Section */}
                  <div className="mb-3">
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className={cn("text-3xl font-normal", darkMode ? "text-white" : "text-gray-900")}>{product.price}</span>
                      <span className={cn("text-lg font-light", darkMode ? "text-gray-400" : "text-gray-600")}>{product.period}</span>
                    </div>
                  </div>
                  {/* Removed: <p className={cn("text-sm leading-relaxed font-light", darkMode ? "text-gray-400" : "text-gray-600")}>{product.description}</p> */}
                </div>

                {/* Features Section */}
                <div className="space-y-2 mb-4 flex-grow">
                  <div className={cn("rounded-2xl p-3 space-y-2", darkMode ? "bg-gray-700/50" : "bg-white/60")}>
                    {/* Credits display */}
                    <div className="flex items-center justify-between">
                      <span className={cn("font-normal text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>Credits</span>
                      <span className={cn("text-lg font-normal", darkMode ? "text-white" : "text-gray-900")}>{product.credits} / mo</span>
                    </div>
                    
                    {/* General Features List */}
                    <div className="pt-2 border-t" style={{ borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                      <ul className="space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className={cn("w-4 h-4", darkMode ? "text-green-400" : "text-green-500")} />
                            <span className={cn("font-light text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSubscribe(product.priceId, product.name)}
                  disabled={loading === product.priceId}
                  className={cn(
                    "w-full h-10 text-base font-normal rounded-2xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 shadow-lg mt-auto",
                    "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-xl"
                  )}
                >
                  {loading === product.priceId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    `Get ${product.name}`
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {tiers.map((product) => (
              <div
                key={product.name}
                className={cn(`relative border-2 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 flex flex-col h-full`,
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                )}
              >
                {product.popular && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-md z-10">
                    Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={cn("text-2xl font-light mb-4", darkMode ? "text-white" : "text-gray-900")}>{product.name}</h3>
                  {/* Removed: <p className={cn("text-sm mb-4 font-light", darkMode ? "text-gray-400" : "text-gray-600")}>{product.description}</p> */}
                  <div className={cn("text-4xl font-light mb-1", darkMode ? "text-white" : "text-gray-900")}>
                    {product.price}
                    <span className={cn("text-lg font-light", darkMode ? "text-gray-400" : "text-gray-600")}>{product.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {/* Credits display */}
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Credits</span>
                    <span className={cn("font-normal", darkMode ? "text-gray-200" : "text-gray-900")}>{product.credits} / mo</span>
                  </div>
                  {/* General Features List */}
                  <ul className="space-y-2 pt-2 border-t" style={{ borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className={cn("w-4 h-4 flex-shrink-0", darkMode ? "text-green-400" : "text-green-500")} />
                        <span className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleSubscribe(product.priceId, product.name)}
                  disabled={loading === product.priceId}
                  className={cn(
                    "w-full text-white font-light py-3 rounded-full transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 mt-auto",
                    "bg-orange-500 hover:bg-orange-500/90"
                  )}
                >
                  {loading === product.priceId ? 'Processing...' : 'Get started'}
                </Button>
              </div>
            ))}
        </div>

        {user && user.subscription_status === 'active' && (
            <div className="mt-16 text-center">
                <h3 className={cn("text-3xl font-light mb-4", darkMode ? "text-white" : "text-gray-900")}>Need a few more credits?</h3>
                <p className={cn("text-lg font-light mb-8 max-w-2xl mx-auto", darkMode ? "text-gray-400" : "text-gray-600")}>Top up your account without changing your plan.</p>
                <div className="max-w-md mx-auto">
                    <div className={cn("border rounded-2xl p-6 md:p-8 hover:shadow-lg transition-all duration-300", darkMode ? "bg-gray-800 border-gray-700" : "bg-slate-50 border-slate-200")}>
                        <h4 className={cn("text-xl md:text-2xl font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>Credit Pack</h4>
                        <p className={cn("font-light mb-6", darkMode ? "text-gray-400" : "text-gray-600")}>Purchase credits in multiples of 10.</p>
                        
                        <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
                            <Button size="icon" variant="outline" onClick={() => handleCreditChange(-10)} disabled={creditAmount <= 10} className={cn("h-8 w-8 md:h-10 md:w-10", darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "")}>
                                <Minus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <span className={cn("text-xl md:text-2xl font-normal w-20 md:w-24 text-center", darkMode ? "text-white" : "text-gray-900")}>{creditAmount} credits</span>
                            <Button size="icon" variant="outline" onClick={() => handleCreditChange(10)} className={cn("h-8 w-8 md:h-10 md:w-10", darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "")}>
                                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </div>
                        
                        <div className={cn("text-3xl md:text-4xl font-normal mb-6", darkMode ? "text-white" : "text-gray-900")}>${creditAmount / oneTimeCreditUnitAmount * oneTimeCreditUnitCost}</div>

                        <Button
                            onClick={() => handleBuyCreditPack(creditAmount)}
                            disabled={loading === 'Credit Pack'}
                            className="w-full bg-orange-500 text-white font-normal rounded-full hover:bg-orange-500/90 transform hover:scale-[1.02] transition-all duration-200 shadow-lg py-2 md:py-3 text-sm md:text-base"
                        >
                            {loading === 'Credit Pack' ? 'Processing...' : `Purchase ${creditAmount} Credits`}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {isSubscriptionView && (
          <div className={cn("border rounded-2xl p-8 mt-16", darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className={cn("text-2xl font-normal mb-2", darkMode ? "text-white" : "text-gray-900")}>Manage Subscription</h2>
                <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Manage your plan, see billing history, or cancel your subscription.</p>
              </div>
              <Button
                onClick={handleManageSubscription}
                disabled={loading === 'manage'}
                className="bg-gray-800 text-white font-normal rounded-full hover:bg-black transform hover:scale-[1.02] transition-all duration-200 shadow-lg px-6 py-3 w-full md:w-auto"
              >
                Change Plan or Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* What's Included Section */}
      <section className={cn("py-20", darkMode ? "bg-gray-800" : "bg-gray-50")}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className={cn("text-3xl md:text-4xl font-light mb-4", darkMode ? "text-white" : "text-gray-900")}>
              Eliminate costly, complex video production.
            </h2>
            <h3 className={cn("text-2xl md:text-3xl font-light mb-8", darkMode ? "text-white" : "text-gray-900")}>
              Every Viduto plan includes:
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>AI-powered video creation</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Advanced AI that understands your product and creates professional videos</p>
            </div>

            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Commercial usage rights</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Use your videos for any commercial purpose without restrictions</p>
            </div>

            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>30-second optimized videos</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Perfect length for social media and maximum engagement</p>
            </div>

            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Text-based creation</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>No video editing skills needed - just describe what you want</p>
            </div>

            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Unlimited revisions</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Request changes until your video is perfect (4 credits per revision)</p>
            </div>

            <div className="text-center">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4", darkMode ? "bg-blue-500/20" : "bg-blue-50")}>
                <Check className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Fast delivery</h4>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Get your professional videos ready in just 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Information */}
      <section className={cn("py-12", darkMode ? "bg-gray-900" : "bg-white")}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className={cn("border rounded-2xl p-8", darkMode ? "bg-blue-900/20 border-blue-500/20" : "bg-blue-50/50 border-blue-100")}>
            <h3 className={cn("text-2xl font-light mb-6", darkMode ? "text-white" : "text-gray-900")}>How Credits Work</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">10</span>
                </div>
                <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Video Generation</h4>
                <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Every video generation costs 10 credits</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-black font-bold text-xl">4</span>
                </div>
                <h4 className={cn("text-lg font-medium mb-2", darkMode ? "text-white" : "text-gray-900")}>Video Revision</h4>
                <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>Every revision costs 4 credits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={cn("py-20", darkMode ? "bg-gray-900" : "bg-white")}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className={cn("text-3xl md:text-4xl font-light text-center mb-12", darkMode ? "text-white" : "text-gray-900")}>
            FAQs
          </h2>
          
          <div className="space-y-6">
            <div className={cn("border-b pb-6", darkMode ? "border-gray-700" : "border-gray-200")}>
              <h3 className={cn("text-lg font-medium mb-3", darkMode ? "text-white" : "text-gray-900")}>What's included in the free plan?</h3>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                New users get 20 free credits to try Viduto - enough to create your first video and see the quality for yourself. 
                This includes access to all core features, Full-HD output, and commercial usage rights.
              </p>
            </div>

            <div className={cn("border-b pb-6", darkMode ? "border-gray-700" : "border-gray-200")}>
              <h3 className={cn("text-lg font-medium mb-3", darkMode ? "text-white" : "text-gray-900")}>How do video credits work?</h3>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                Each video generation uses 10 credits, and each revision uses 4 credits. Credits reset monthly with your subscription. 
                You can also purchase additional credits anytime for $10 per 10 credits.
              </p>
            </div>

            <div className={cn("border-b pb-6", darkMode ? "border-gray-700" : "border-gray-200")}>
              <h3 className={cn("text-lg font-medium mb-3", darkMode ? "text-white" : "text-gray-900")}>What happens if I reach my plan limits?</h3>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                If you run out of credits, you can either wait for your monthly reset or purchase additional credits. 
                You can also upgrade to a higher plan anytime to get more monthly credits.
              </p>
            </div>

            <div className={cn("border-b pb-6", darkMode ? "border-gray-700" : "border-gray-200")}>
              <h3 className={cn("text-lg font-medium mb-3", darkMode ? "text-white" : "text-gray-900")}>Can I cancel my subscription anytime?</h3>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features 
                until the end of your current billing period.
              </p>
            </div>

            <div className={cn("pb-6", darkMode ? "" : "")}>
              <h3 className={cn("text-lg font-medium mb-3", darkMode ? "text-white" : "text-gray-900")}>Do you offer refunds?</h3>
              <p className={cn("font-light", darkMode ? "text-gray-400" : "text-gray-600")}>
                We offer a 30-day money-back guarantee for all subscription plans. If you're not satisfied with Viduto, 
                contact our support team for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-500 to-purple-500 py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black mb-8 leading-tight">
            Ready to transform your
            <br />
            product marketing?
          </h2>
          <p className="text-xl text-black/80 max-w-2xl mx-auto mb-8 font-light">
            Join thousands of businesses already creating viral videos with Viduto
          </p>
          <Button
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                // Navigate to top of dashboard
                window.location.href = '/dashboard';
              }
            }}
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Start creating videos
          </Button>
        </div>
      </section>

      {/* Add AuthModal */}
      {typeof window !== 'undefined' && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
