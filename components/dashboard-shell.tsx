'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WorkspaceProvider, useWorkspace } from './workspace-context'
import ThemeToggle from './theme-toggle'
import {
  LayoutDashboard,
  Cpu,
  MessageSquare,
  Instagram,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  User2,
  Sparkles,
  Share2,
  Link2,
  Wallet,
} from 'lucide-react'

interface ShellProps {
  children: React.ReactNode
  profile: {
    name: string
    avatarUrl?: string
    email: string
  }
  workspaces: any[]
}

const NAV_ITEMS = [
  { label: 'Connections', href: '/dashboard/connections', icon: Link2 },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Automations', href: '/dashboard/automations', icon: Cpu },
  { label: 'AI Agent', href: '/dashboard/ai-agent', icon: Sparkles },
  { label: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  { label: 'Refer & Earn', href: '/dashboard/referral', icon: Share2 },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]


function DashboardLayoutInner({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: { name: string; avatarUrl?: string; email: string }
}) {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans antialiased overflow-hidden transition-colors duration-150">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/3 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/2 dark:bg-emerald-500/3 rounded-full blur-3xl pointer-events-none z-0" />

      {/* MOBILE HEADER */}
      <header className="md:hidden relative flex items-center justify-between px-6 py-4 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 z-40 w-full">
        <div className="flex items-center gap-2.5">
          <img src="/AutoEngage_logo.png" alt="AutoEngage" className="h-8 w-auto" />
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">AutoEngage</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-md text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* SIDEBAR FOR DESKTOP & MOBILE FLYOUT */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-30 flex flex-col w-64 bg-zinc-50/85 dark:bg-zinc-900/60 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800/80 transition-all duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } z-50`}
      >
        {/* Logo and Header */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-zinc-200 dark:border-zinc-800/60">
          <img src="/AutoEngage_logo.png" alt="AutoEngage" className="h-10 w-auto" />
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">AutoEngage</span>
        </div>

        {/* Workspace Selector */}
        <div className="relative px-4 py-4 border-b border-zinc-200 dark:border-zinc-800/40">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors text-sm text-left font-medium cursor-pointer"
          >
            <span className="truncate text-zinc-800 dark:text-zinc-200">{activeWorkspace?.name || 'Loading...'}</span>
            <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute left-4 right-4 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    setActiveWorkspace(workspace)
                    setWorkspaceDropdownOpen(false)
                    router.refresh()
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    activeWorkspace?.id === workspace.id ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-zinc-800/30' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-650 dark:text-indigo-400 border-l-2 border-indigo-500 shadow-sm'
                    : 'text-zinc-550 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between gap-3 bg-zinc-100/30 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2.5 min-w-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
                {profile.name[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{profile.name}</span>
              <span className="text-[10px] text-zinc-500 truncate">{profile.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 rounded-md text-zinc-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU BACKGROUND OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="relative flex-1 flex flex-col min-w-0 z-10 overflow-y-auto">
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardShell({ children, profile, workspaces }: ShellProps) {
  return (
    <WorkspaceProvider initialWorkspaces={workspaces}>
      <DashboardLayoutInner profile={profile}>{children}</DashboardLayoutInner>
    </WorkspaceProvider>
  )
}
