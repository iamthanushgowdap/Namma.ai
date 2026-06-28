'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      priceMonthly: 0,
      priceAnnual: 0,
      billingInfoMonthly: '/mo',
      billingInfoAnnual: '/mo',
      description: 'Ideal for getting started with automation.',
      features: [
        '3 active automations',
        '100 automated replies/mo',
        '1 connected Instagram account',
        'Basic analytics overview',
        'Community support channel'
      ],
      cta: 'Get Started',
      href: '/login',
      badge: null,
      color: 'zinc'
    },
    {
      id: 'starter',
      name: 'Starter',
      priceMonthly: 499,
      priceAnnual: 399,
      billingInfoMonthly: '/mo',
      billingInfoAnnual: ' /mo (billed ₹4,788/yr)',
      description: 'Perfect for growing creators and personal brands.',
      features: [
        '10 active automations',
        '1,000 automated replies/mo',
        '1 connected Instagram account',
        'Advanced traffic analytics',
        'Direct email support',
        'Priority keyword matching'
      ],
      cta: 'Upgrade Now',
      href: '/login',
      badge: null,
      color: 'zinc'
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: 1499,
      priceAnnual: 1199,
      billingInfoMonthly: '/mo',
      billingInfoAnnual: ' /mo (billed ₹14,388/yr)',
      description: 'Best choice for serious businesses & active creators.',
      features: [
        'Unlimited active automations',
        '10,000 automated replies/mo',
        '3 connected Instagram accounts',
        'Real-time conversion stats',
        'Priority email/chat support',
        'Custom triggers & AI fallback',
        'Webhook integrations'
      ],
      cta: 'Go Pro',
      href: '/login',
      badge: 'MOST POPULAR',
      color: 'purple'
    },
    {
      id: 'agency',
      name: 'Agency',
      priceMonthly: 3999,
      priceAnnual: 3199,
      billingInfoMonthly: '/mo',
      billingInfoAnnual: ' /mo (billed ₹38,388/yr)',
      description: 'Custom scaling for social media agencies & brands.',
      features: [
        'Unlimited active automations',
        'Unlimited replies/mo',
        '10 connected Instagram accounts',
        'White-label ready',
        'Dedicated account manager',
        'Direct developer API access',
        'Custom integrations',
        'SLA delivery guarantee'
      ],
      cta: 'Contact Sales',
      href: 'mailto:contact@autoengage.ai?subject=Inquiry%20about%20AutoEngage%20Agency%20Plan',
      badge: null,
      color: 'amber'
    }
  ]

  return (
    <section id="pricing" className="relative z-10 py-24 border-t border-zinc-150 dark:border-zinc-900/60">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            Simple, transparent plans
          </h2>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-8">
            Find the perfect plan to automate your Instagram account. Start free, upgrade anytime.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full border border-zinc-200 dark:border-zinc-800/40">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>Annual billing</span>
              <span className="bg-emerald-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isPro = plan.color === 'purple'
            const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnual
            const billingInfo = billingPeriod === 'monthly' ? plan.billingInfoMonthly : plan.billingInfoAnnual

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  isPro
                    ? 'bg-white dark:bg-zinc-900 border border-purple-500/50 shadow-xl shadow-purple-500/5 ring-1 ring-purple-500/10'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/60'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#B41DE6] to-[#0052cc] text-white text-[9px] font-bold px-3 py-1 rounded-full tracking-widest">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3
                    className={`font-bold text-sm mb-1 ${
                      plan.color === 'amber'
                        ? 'text-amber-600 dark:text-amber-500'
                        : isPro
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  
                  {/* Pricing Details */}
                  <div className="mb-4">
                    <span
                      className={`text-3xl font-extrabold ${
                        isPro
                          ? 'text-transparent bg-gradient-to-r from-[#B41DE6] to-[#0052cc] bg-clip-text'
                          : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      ₹{price.toLocaleString()}
                    </span>
                    <span className="text-zinc-550 dark:text-zinc-450 text-xs font-normal">
                      {billingInfo}
                    </span>
                  </div>
                  
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isPro
                              ? 'text-purple-550 dark:text-purple-500'
                              : 'text-emerald-555 dark:text-emerald-500'
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                {plan.id === 'agency' ? (
                  <a
                    href={plan.href}
                    className="w-full text-center py-2.5 bg-zinc-200 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {plan.cta}
                  </a>
                ) : isPro ? (
                  <Link
                    href={plan.href}
                    className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] shadow-md shadow-purple-650/20 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)' }}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    href={plan.href}
                    className="w-full text-center py-2.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
        
      </div>
    </section>
  )
}
