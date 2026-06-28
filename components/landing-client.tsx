'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/theme-toggle'
import PricingSection from '@/components/pricing-section'
import {
  Zap,
  MessageCircle,
  Instagram,
  Cpu,
  Inbox,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MessageSquareCode,
  Users,
  Lock,
  Coins,
  ChevronRight,
  MessageSquare,
  Shield,
  Sparkles
} from 'lucide-react'

export default function LandingClient() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [coords, setCoords] = useState({ x: 0, y: 0, scale: 1, opacity: 1 })

  useEffect(() => {
    const handleScroll = () => {
      const placeholder = document.getElementById('hero-title-placeholder')
      const target = document.getElementById('hero-title-target')
      const floating = document.getElementById('hero-title-floating')
      if (!placeholder || !target || !floating) return

      const placeholderRect = placeholder.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Calculate absolute center coordinates relative to the document
      const sourceX = placeholderRect.left + placeholderRect.width / 2
      const sourceY = placeholderRect.top + placeholderRect.height / 2 + scrollTop
      
      const targetX = targetRect.left + targetRect.width / 2
      const targetY = targetRect.top + targetRect.height / 2 + scrollTop

      // Total distance the element must travel
      const deltaX = targetX - sourceX
      const deltaY = targetY - sourceY

      // Complete animation slightly before the target reaches its scrolled position
      const endScroll = Math.max(300, Math.abs(deltaY) - 160)
      const currentScroll = Math.min(endScroll, Math.max(0, scrollTop))
      const progress = currentScroll / endScroll

      setScrollProgress(progress)

      // Calculate target scale factor based on physical widths
      const targetScale = placeholderRect.width > 0 ? (targetRect.width / placeholderRect.width) : 0.08

      const scale = 1 + progress * (targetScale - 1)
      const x = progress * deltaX
      const y = progress * deltaY

      // Fade out at the very end to hand-off cleanly to the target element
      const opacity = progress > 0.95 ? (1 - (progress - 0.95) * 20) : 1

      setCoords({ x, y, scale, opacity })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll() // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      
      {/* Glow overlays */}
      <div className="absolute top-[30%] -left-[20%] w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-800/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] -right-[20%] w-[600px] h-[600px] bg-pink-500/5 dark:bg-pink-800/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── 1. Floating Bottom Navbar ────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[850px]">
        <div 
          className="h-16 rounded-full border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between px-6 shadow-2xl transition-all duration-300 hover:border-purple-500/30 hover:shadow-purple-500/10 bg-white/85 dark:bg-zinc-955/85"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/Nammaai_logo.png" alt="Namma.ai" className="h-11 w-auto" />
          </Link>

          {/* Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <a href="#features" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all">
              Features
            </a>
            <a href="#how-it-works" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all">
              How It Works
            </a>
            <a href="#pricing" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-all">
              Pricing
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3 py-2 transition-colors">
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="text-xs font-bold text-white px-4 py-2 rounded-full transition-transform duration-200 active:scale-[0.97] shadow-lg shadow-purple-900/35 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)' }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen lg:h-[100vh] flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Content Wrapper to push content upwards */}
        <div className="flex flex-col items-center w-full -translate-y-6 lg:-translate-y-12">
          {/* Big Brand Header */}
          <div className={`mb-6 animate-fade-in relative ${scrollProgress > 0 ? '' : 'animate-float'}`}>
            {/* Invisible placeholder to reserve layout height/width */}
            <h1 
              id="hero-title-placeholder"
              className="font-dirty text-7xl sm:text-8xl md:text-9xl font-black tracking-[0.1em] opacity-0 select-none leading-none pointer-events-none"
            >
              Namma.ai
            </h1>
            
            {/* Actual animating/floating title */}
            <h1 
              id="hero-title-floating"
              className="font-dirty text-7xl sm:text-8xl md:text-9xl font-black tracking-[0.1em] bg-gradient-to-r from-[#B41DE6] via-[#D331AC] to-[#F94475] bg-clip-text text-transparent leading-none drop-shadow-sm select-none animate-gradient-flow absolute inset-0 z-50 transform-gpu"
              style={{
                transform: `translate3d(${coords.x}px, ${coords.y}px, 0) scale(${coords.scale})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                opacity: coords.opacity,
              }}
            >
              Namma.ai
            </h1>
          </div>

          {/* Animated Pulsing Badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#B41DE6] to-[#0052cc]" />
            60,000+ Creators automated
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-zinc-900 dark:text-white leading-[1.1] tracking-tight mb-5 max-w-3xl">
            Turn comments into<br />
            <span className="bg-gradient-to-r from-[#B41DE6] to-[#0052cc] bg-clip-text text-transparent">
              paying customers
            </span>
          </h2>

          {/* Sub-headline */}
          <p className="text-zinc-550 dark:text-zinc-400 text-sm sm:text-lg max-w-xl mb-8 leading-relaxed">
            Auto-reply to Instagram comments &amp; DMs in seconds. No code. No delays. Just results.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-0">
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-purple-600/25 transition-all duration-200 hover:shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)' }}
            >
              Start for Free &rarr;
            </Link>
            <a 
              href="#mockup-showcase"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 transition-all duration-200"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a 
          href="#mockup-showcase"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-65 hover:opacity-100 transition-opacity cursor-pointer z-20"
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Scroll to explore</span>
          <div className="w-5 h-8 border-2 border-zinc-300 dark:border-zinc-700 rounded-full flex justify-center p-1">
            <div className="w-1 h-1.5 bg-gradient-to-b from-[#B41DE6] to-[#0052cc] rounded-full animate-bounce" />
          </div>
        </a>
      </section>

      {/* ── 2.5. Mockup & Stats Showcase Section (Visible on Scroll) ────────────────────────── */}
      <section id="mockup-showcase" className="relative z-10 py-24 text-center max-w-5xl mx-auto px-6 border-t border-zinc-100/60 dark:border-zinc-900/60">
        <div className="text-center mb-12">
          <span className="inline-flex bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
            Real-time Activity
          </span>
          <h3 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            See Namma.ai in action
          </h3>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
            Our intelligent engine connects DMs, comments, and conversions seamlessly.
          </p>
        </div>

        {/* Global SVG Gradients Definition */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="wire-gradient-v1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0052cc" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="wire-gradient-h1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0052cc" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="wire-gradient-v2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#B41DE6" />
            </linearGradient>
            <linearGradient id="wire-gradient-h2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#B41DE6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Mockup Showcase Grid */}
        <div className="relative w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-16 px-4">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes flow-horizontal {
              from { stroke-dashoffset: 20; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes flow-vertical {
              from { stroke-dashoffset: 20; }
              to { stroke-dashoffset: 0; }
            }
            .animate-wire-flow-h {
              stroke-dasharray: 6 6;
              animation: flow-horizontal 1.5s linear infinite;
            }
            .animate-wire-flow-v {
              stroke-dasharray: 6 6;
              animation: flow-vertical 1.5s linear infinite;
            }
          `}} />

          {/* Left card: Comment trigger notification */}
          <div className="relative w-full max-w-[270px] bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2 animate-float md:translate-y-[-20px] z-20 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                A
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">alex_creates</div>
                <div className="text-[10px] text-zinc-550">commented on your post</div>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-955/60 border border-zinc-100 dark:border-zinc-800/40 rounded-xl p-2.5 text-xs text-zinc-700 dark:text-zinc-300 text-left font-medium">
              &quot;Send me the link! &bull;&bull;&quot;
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold text-left flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              ⚡ Auto-reply triggered
            </div>
          </div>

          {/* Connector 1 */}
          <div className="flex items-center justify-center w-full md:w-auto md:flex-1 h-12 md:h-auto shrink-0 md:shrink md:mx-[-8px] z-0">
            {/* Mobile Vertical Wire */}
            <svg className="block md:hidden w-8 h-12" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 16 0 L 16 48" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" className="animate-wire-flow-v" />
            </svg>
            {/* Desktop Horizontal S-Curve Wire */}
            <svg className="hidden md:block w-full h-24" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M 0 10 C 50 10, 50 30, 100 30" stroke="url(#wire-gradient-h1)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="animate-wire-flow-h" />
            </svg>
          </div>

          {/* Center phone preview */}
          <div className="w-[170px] h-[260px] bg-zinc-200 dark:bg-black border-4 border-zinc-300 dark:border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col z-10 shrink-0">
            <div className="h-6 bg-zinc-100 dark:bg-zinc-955 flex items-center justify-center shrink-0">
              <div className="w-12 h-3.5 bg-zinc-350 dark:bg-black rounded-full" />
            </div>
            {/* Branded Header inside Phone */}
            <div className="h-8 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center gap-1.5 px-3 shrink-0">
              <img src="/Nammaai_logo.png" alt="Namma.ai" className="h-4.5 w-auto" />
              <span className="font-bold text-[8px] text-zinc-850 dark:text-zinc-200 tracking-tight">Namma.ai</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto animate-pulse" />
            </div>
            
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-955 p-2 flex flex-col justify-between gap-1.5 text-[8px] text-left">
              {/* Active Agent Welcome Box */}
              <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.05] rounded-xl p-2 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[5px] font-bold text-zinc-400 uppercase tracking-wider">System Online</span>
                </div>
                <div className="h-4 flex items-center justify-center mt-1">
                  <span 
                    id="hero-title-target" 
                    className="font-dirty text-[10px] font-black tracking-wider bg-gradient-to-r from-[#B41DE6] via-[#D331AC] to-[#F94475] bg-clip-text text-transparent transition-opacity duration-150"
                    style={{
                      opacity: scrollProgress > 0.95 ? 1 : 0
                    }}
                  >
                    Namma.ai
                  </span>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="flex flex-col gap-1.5 mt-auto">
                <div className="bg-zinc-200/80 text-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 rounded-xl rounded-bl-sm p-1.5 max-w-[85%] self-start">
                  Hey, send me the info! 🙌
                </div>
                <div className="bg-gradient-to-tr from-[#B41DE6] to-[#0052cc] text-white rounded-xl rounded-br-sm p-1.5 max-w-[85%] self-end">
                  Here you go 👉 namma.ai/join
                </div>
              </div>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="flex items-center justify-center w-full md:w-auto md:flex-1 h-12 md:h-auto shrink-0 md:shrink md:mx-[-8px] z-0">
            {/* Mobile Vertical Wire */}
            <svg className="block md:hidden w-8 h-12" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 16 0 L 16 48" stroke="#B41DE6" strokeWidth="4" strokeLinecap="round" className="animate-wire-flow-v" />
            </svg>
            {/* Desktop Horizontal S-Curve Wire */}
            <svg className="hidden md:block w-full h-24" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M 0 10 C 50 10, 50 30, 100 30" stroke="url(#wire-gradient-h2)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="animate-wire-flow-h" />
            </svg>
          </div>

          {/* Right card: Conversion notification */}
          <div className="relative w-full max-w-[270px] bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2 animate-float [animation-delay:3s] md:translate-y-[20px] z-0 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-[#0052cc] flex items-center justify-center text-white text-sm shrink-0">
                🎉
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">New Conversion!</div>
                <div className="text-[10px] text-zinc-550">just now via DM</div>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-955/60 border border-zinc-100 dark:border-zinc-850/40 rounded-xl p-2.5 text-xs text-zinc-700 dark:text-zinc-300 text-left font-semibold">
              Replied successfully to alex_creates
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-8 sm:gap-16 mt-4 flex-wrap text-center relative z-10">
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">60K+</div>
            <div className="text-xs text-zinc-500 font-medium mt-0.5">Creators Automated</div>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">3M+</div>
            <div className="text-xs text-zinc-500 font-medium mt-0.5">DMs Sent</div>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">4.9★</div>
            <div className="text-xs text-zinc-500 font-medium mt-0.5">User Rating</div>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works Section ─────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Process
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Automate in minutes
            </h2>
            <p className="text-zinc-550 dark:text-zinc-450 text-sm sm:text-base max-w-md mx-auto">
              Setting up your campaign takes less than two minutes. Connect, configure, and let it run.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="relative group bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/10">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-3xl font-extrabold text-zinc-200 dark:text-zinc-800 font-mono">01</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Connect Instagram</h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                Auth with Meta in one click. We connect to your Professional or Creator account securely.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative group bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/10">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-3xl font-extrabold text-zinc-200 dark:text-zinc-800 font-mono">02</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Set Trigger Keywords</h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                Define the trigger word (like &quot;GUIDE&quot;, &quot;LINK&quot;, or &quot;DEAL&quot;) and design your message template.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative group bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/10">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-3xl font-extrabold text-zinc-200 dark:text-zinc-800 font-mono">03</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Replies Sent Instantly</h3>
              <p className="text-zinc-555 dark:text-zinc-400 text-sm leading-relaxed">
                When someone comments, Namma.ai automatically delivers your custom DM and replies to the comment.
              </p>
            </div>

            {/* Step 4 — Follow-Gate */}
            <div className="relative group bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-purple-800/30 rounded-2xl p-8 transition-all hover:border-purple-500/40 dark:hover:border-purple-500/40">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/10">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="absolute top-6 right-6 text-3xl font-extrabold text-zinc-200 dark:text-zinc-800 font-mono">04</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Optional: Require a Follow</h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                Enable Follow-Gate to send an interactive DM card. Users tap &quot;I&apos;ve Followed&quot; — if verified, they get the link instantly. If not, a Recheck button guides them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Features Bento Grid ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 text-pink-600 dark:text-pink-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Built for Instagram Growth
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
              Everything you need to automate interactions, run viral campaigns, and capture leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: DM Automation */}
            <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <MessageCircle className="w-5 h-5 text-purple-650 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Direct Message Automation</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                  Send automated replies directly to user inboxes. Set up multiple templates, randomize replies to prevent blocks, and insert dynamic tags like user name.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4 text-xs text-purple-650 dark:text-purple-400 font-semibold">
                <span>Personalized templates</span>
                <span>&bull;</span>
                <span>Randomization engine</span>
              </div>
            </div>

            {/* Bento Card 2: Comment Replies */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6">
                  <MessageSquareCode className="w-5 h-5 text-pink-650 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Comment Autoreplies</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                  Reply to public post/reel comments instantly, increasing social signals and pushing your post up the Instagram algorithm.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-pink-650 dark:text-pink-400 font-semibold">
                Algorithm-boost ready
              </div>
            </div>

            {/* Bento Card 3: Keyword Triggers */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Zap className="w-5 h-5 text-blue-650 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Keyword Triggers</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                  Trigger automations on exact keywords or close spelling matches. Create complex flows based on customer triggers.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-blue-650 dark:text-blue-400 font-semibold">
                Exact &amp; Fuzzy match
              </div>
            </div>

            {/* Bento Card 4: AI Powered Responses */}
            <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <Cpu className="w-5 h-5 text-emerald-650 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">AI-Powered Intelligent Agent</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                  Fallback on an AI engine when keywords don&apos;t match. The agent understands context, resolves product FAQs, and holds conversational chats with prospects.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4 text-xs text-emerald-650 dark:text-emerald-400 font-semibold">
                <span>Contextual FAQs</span>
                <span>&bull;</span>
                <span>Intelligent fallback</span>
              </div>
            </div>

            {/* Bento Card 5: Live Inbox */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                  <Inbox className="w-5 h-5 text-orange-650 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Unified Live Inbox</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                  Monitor conversations in real time. Pause automation with one click to step in and chat live with a customer.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-orange-650 dark:text-orange-400 font-semibold">
                Manual agent takeover
              </div>
            </div>

            {/* Bento Card 6: Analytics Dashboard */}
            <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                  <BarChart3 className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Campaign Analytics</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                  Track comment rates, DM open rates, link clicks, and conversion events. Understand which reels and keywords are driving the highest ROI.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4 text-xs text-indigo-650 dark:text-indigo-400 font-semibold">
                <span>Conversion rate tracking</span>
                <span>&bull;</span>
                <span>Reel level statistics</span>
              </div>
            </div>

            {/* Bento Card 7: Follow-Gate Automation */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-purple-800/30 rounded-2xl p-8 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <Lock className="w-5 h-5 text-purple-650 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Follow-Gate Automation</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed">
                  Require followers-only access. Sends an interactive DM card — users verify their follow with a button tap, then instantly receive the link. Grows your audience automatically.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4 text-xs text-purple-650 dark:text-purple-400 font-semibold">
                <span>Follower verification</span>
                <span>&bull;</span>
                <span>Instant reward delivery</span>
              </div>
            </div>

            {/* Bento Card 8: Refer & Earn Wallet */}
            <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-emerald-800/30 rounded-2xl p-8 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <Coins className="w-5 h-5 text-emerald-650 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Refer &amp; Earn Wallet</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                  Earn a 10% recurring cash commission on all subscription payments made by users you refer. Referred friends receive a 15% discount on their first billing cycle. Spend your earned credits on your own subscription to get an extra 10% discount, or withdraw to your bank account!
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center gap-4 text-xs text-emerald-650 dark:text-emerald-400 font-semibold">
                <span>10% Referral payouts</span>
                <span>&bull;</span>
                <span>15% Signup discount</span>
                <span>&bull;</span>
                <span>Peer-to-peer transfers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Testimonials Section ──────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-24 border-t border-zinc-150 dark:border-zinc-900/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-650 dark:text-purple-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Social Proof
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Trusted by 60,000+ creators
            </h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
              See how influencers, brands, and agencies use Namma.ai to scale their conversations automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all duration-300">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="text-zinc-750 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 italic">
                  &quot;Namma.ai helped me generate ₹1.2L in course sales in just 48 hours by auto-replying to DMs. Absolute game changer for creators!&quot;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B41DE6] to-[#0052cc] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  AS
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">Aanya Sharma</div>
                  <div className="text-[10px] text-zinc-500">@aanya.social &bull; 85k followers</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all duration-300">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="text-zinc-750 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 italic">
                  &quot;We manage 12 client accounts. Switching to Namma.ai saved us 30+ hours/week and boosted client lead volume by 40%. The pricing is unbeatable.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  VM
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">Vikram Malhotra</div>
                  <div className="text-[10px] text-zinc-550">Founder, VMedia Agency</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-zinc-50/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all duration-300">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="text-zinc-750 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 italic">
                  &quot;My engagement rate went up by 150% because comments are replied to within 5 seconds. The AI fallback handles all my product sizing FAQs perfectly!&quot;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0052cc] to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  NV
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">Neha Verma</div>
                  <div className="text-[10px] text-zinc-550">@neha.designs &bull; 120k followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Pricing Section ────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ Section ──────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-24 border-t border-zinc-150 dark:border-zinc-900/60">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 text-pink-600 dark:text-pink-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Questions
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
              Everything you need to know about safety, billing, and how Namma.ai works.
            </p>
          </div>

          <div className="space-y-4">
            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/35 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 text-sm sm:text-base font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                <span>Is Namma.ai safe to use? Will my Instagram account get shadowbanned?</span>
                <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed border-t border-zinc-150 dark:border-zinc-800/30 pt-4">
                Yes, Namma.ai is 100% safe. We connect using official Meta Graph APIs and strictly follow Meta&apos;s Developer Terms. We never ask for your Instagram password, nor do we perform scraping or unofficial interactions that violate platform policies. Your account is completely secure.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/35 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 text-sm sm:text-base font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                <span>Do I need a credit card to sign up for the free plan?</span>
                <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed border-t border-zinc-150 dark:border-zinc-800/30 pt-4">
                No credit card is required. You can sign up, connect your Instagram account, and start using our Free plan immediately with no obligations.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/35 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 text-sm sm:text-base font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                <span>Can I change or cancel my plan anytime?</span>
                <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-555 dark:text-zinc-400 leading-relaxed border-t border-zinc-150 dark:border-zinc-800/30 pt-4">
                Yes. You can cancel, upgrade, or downgrade your subscription at any time directly from the Billing settings in your dashboard. If you cancel, your paid features will remain active until the end of your billing cycle.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/35 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 text-sm sm:text-base font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                <span>Do you offer refunds?</span>
                <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed border-t border-zinc-150 dark:border-zinc-800/30 pt-4">
                We offer a 7-day refund window if you encounter technical difficulties that prevent our service from operating. Please read our complete Refund Policy or contact support at contact@namma.ai for assistance.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/35 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 text-sm sm:text-base font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                <span>How does the AI-powered fallback agent work?</span>
                <span className="ml-4 shrink-0 transition-transform duration-300 group-open:rotate-45 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed border-t border-zinc-150 dark:border-zinc-800/30 pt-4">
                When a user comments or sends a DM that doesn&apos;t match any of your pre-defined keyword triggers, our AI engine can step in (if enabled). It reads your uploaded product/service FAQs and answers customer questions conversationally, mimicking a live support agent to capture leads 24/7.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ── 6. CTA Banner ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-[#B41DE6]/10 via-[#0052cc]/10 to-[#B41DE6]/5 border-t border-b border-zinc-200 dark:border-white/[0.06] text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-800/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white mb-6 tracking-tight leading-tight">
            Ready to automate your Instagram?
          </h2>
          <p className="text-zinc-650 dark:text-zinc-350 text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
            Join 60,000+ creators, influencers, and modern brands who are scaling their DM engagement and generating conversions 24/7.
          </p>
          <Link 
            href="/login" 
            className="inline-flex px-8 py-4 rounded-2xl font-extrabold text-white text-base transition-transform duration-200 active:scale-[0.98] shadow-2xl shadow-purple-600/30 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #B41DE6 0%, #0052cc 100%)' }}
          >
            Start Free Now &rarr;
          </Link>
        </div>
      </section>

      {/* ── 7. Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-zinc-50 dark:bg-zinc-950 py-16 border-t border-zinc-200 dark:border-zinc-900/60 mt-auto">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            
            {/* Logo + Tagline */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/Nammaai_logo.png" alt="Namma.ai" className="h-9 w-auto" />
                <span className="font-extrabold text-lg text-zinc-900 dark:text-white tracking-tight">
                  Namma.ai
                </span>
              </div>
              <p className="text-zinc-550 dark:text-zinc-500 text-xs leading-relaxed max-w-xs mb-4">
                AI-powered Instagram DM &amp; comment automation platform. Convert comments into customers &mdash; automatically.
              </p>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-600">
                Operated by Thanush Gowda P, Karnataka, India.
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5 text-xs text-zinc-500 dark:text-zinc-500">
                <li>
                  <Link href="/legal/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refund" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Refund &amp; Cancellation
                  </Link>
                </li>
                <li>
                  <Link href="/legal/deletion" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Data Deletion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support / Contact */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-4">Contact</h4>
              <ul className="space-y-2.5 text-xs text-zinc-500 dark:text-zinc-500">
                <li>
                  <a href="mailto:contact@namma.ai" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                    contact@namma.ai
                  </a>
                </li>
                <li className="text-[10px] text-zinc-500 dark:text-zinc-600 leading-normal">
                  Got questions? We respond to data and general billing queries within 3 business days.
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Bar */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-650">
            <div>
              &copy; {new Date().getFullYear()} Namma.ai. All rights reserved.
            </div>
            <div className="flex items-center gap-1.5">
              <span>Governed by Indian law</span>
              <span>&bull;</span>
              <span>Karnataka jurisdiction</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
