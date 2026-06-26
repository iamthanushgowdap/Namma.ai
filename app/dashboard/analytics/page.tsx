'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  MessageSquare,
  Zap,
  Users,
  Percent,
  RefreshCw,
  BarChart3,
} from 'lucide-react'

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspace()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    automationTriggers: 0,
    manualReplies: 0,
    leads: 0,
    conversionRate: 0,
  })
  const [trafficChartData, setTrafficChartData] = useState<any[]>([])
  const [intentChartData, setIntentChartData] = useState<any[]>([])

  const supabase = createClient()

  // Hydration safeguard
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchMetrics = async () => {
    if (!activeWorkspace) return
    setLoading(true)
    try {
      const workspaceId = activeWorkspace.id

      // 1. Fetch conversations (Leads count)
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('workspace_id', workspaceId)

      if (convError) throw convError
      const leadsCount = convs?.length || 0

      // 2. Fetch all messages in workspace conversations
      let msgCount = 0
      let automatedCount = 0
      let manualCount = 0
      let conversion = 0
      let msgs: any[] = []

      if (leadsCount > 0) {
        const { data, error: msgError } = await supabase
          .from('messages')
          .select('created_at, sender, content')
          .in(
            'conversation_id',
            convs.map((c) => c.id)
          )

        if (msgError) throw msgError
        msgs = data || []
        msgCount = msgs.length
        automatedCount = msgs.filter((m) => m.sender === 'ai').length
        manualCount = msgs.filter((m) => m.sender === 'user').length

        // Calculate conversion rate: resolved conversations / total conversations
        const resolvedCount = convs.filter((c) => c.status === 'resolved').length
        conversion = Math.round((resolvedCount / leadsCount) * 100)
      }

      // Fetch AI Settings for keyword triggers in intent classification
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single()

      // Compile real weekly message traffic data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const trafficMap: Record<string, { date: string, Incoming: number, Automated: number, Manual: number }> = {}
      
      // Pre-fill last 7 days in order
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dayName = days[d.getDay()]
        trafficMap[dayName] = { date: dayName, Incoming: 0, Automated: 0, Manual: 0 }
      }
      
      if (msgs.length > 0) {
        msgs.forEach(m => {
          const d = new Date(m.created_at)
          const dayName = days[d.getDay()]
          if (trafficMap[dayName]) {
            if (m.sender === 'instagram_user') {
              trafficMap[dayName].Incoming++
            } else if (m.sender === 'ai') {
              trafficMap[dayName].Automated++
            } else if (m.sender === 'user') {
              trafficMap[dayName].Manual++
            }
          }
        })
      }
      const trafficData = Object.values(trafficMap)

      // Compile real intent classification data
      const detectIntentClient = (text: string) => {
        const normalized = text.toLowerCase().trim()
        
        const greeting = settings?.greeting_keywords || ['hi', 'hello', 'hey', 'hola']
        const pricing = settings?.pricing_keywords || ['price', 'pricing', 'cost', 'how much']
        const product = settings?.product_keywords || ['product', 'features', 'what is']
        const support = settings?.support_keywords || ['help', 'support', 'contact']
        
        if (greeting.some((k: string) => normalized.includes(k.toLowerCase().trim()))) return 'Greeting'
        if (pricing.some((k: string) => normalized.includes(k.toLowerCase().trim()))) return 'Pricing'
        if (product.some((k: string) => normalized.includes(k.toLowerCase().trim()))) return 'Product Info'
        if (support.some((k: string) => normalized.includes(k.toLowerCase().trim()))) return 'Support'
        return 'Unknown'
      }

      const intentCounts = {
        Pricing: 0,
        Greeting: 0,
        'Product Info': 0,
        Support: 0,
        Unknown: 0
      }

      if (msgs.length > 0) {
        msgs.filter(m => m.sender === 'instagram_user').forEach(m => {
          const intent = detectIntentClient(m.content)
          intentCounts[intent]++
        })
      }

      const intentData = [
        { name: 'Pricing', Triggers: intentCounts.Pricing, fill: '#6366f1' },
        { name: 'Greeting', Triggers: intentCounts.Greeting, fill: '#818cf8' },
        { name: 'Product Info', Triggers: intentCounts['Product Info'], fill: '#34d399' },
        { name: 'Support', Triggers: intentCounts.Support, fill: '#f59e0b' },
        { name: 'Unknown', Triggers: intentCounts.Unknown, fill: '#6b7280' },
      ]

      setMetrics({
        totalMessages: msgCount,
        automationTriggers: automatedCount,
        manualReplies: manualCount,
        leads: leadsCount,
        conversionRate: conversion,
      })
      setTrafficChartData(trafficData)
      setIntentChartData(intentData)

    } catch (err) {
      console.error('Failed to load analytics metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [activeWorkspace])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Aggregating analytics data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Analyze your Instagram automation efficacy and user intent metrics.
          </p>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Conversations</span>
            <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics.leads}</span>
            <span className="text-[10px] text-zinc-500 font-medium">unique contacts</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Processed Messages</span>
            <MessageSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics.totalMessages}</span>
            <span className="text-[10px] text-zinc-500 font-medium">exchanged</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Auto Triggers</span>
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics.automationTriggers}</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/10">
              {metrics.totalMessages > 0 ? Math.round((metrics.automationTriggers / metrics.totalMessages) * 100) : 0}% auto
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Conversion Rate</span>
            <Percent className="w-4 h-4 text-pink-500 dark:text-pink-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{metrics.conversionRate}%</span>
            <span className="text-[10px] text-zinc-500 font-medium">resolved threads</span>
          </div>
        </div>

      </div>

      {/* Recharts Data Visualization Column Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Traffic Analytics */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800/80 space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Message Traffic Overview
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Monitor incoming messages and response types over the last 7 days.
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trafficChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAutomated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a" opacity={0.15} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="Incoming"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncoming)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Automated"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAutomated)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Chart: Intent Frequency */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800/80 flex flex-col space-y-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                AI Intent Classification
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Breakdown of user queries classified by the AI response engine.
              </p>
            </div>

            <div className="flex-1 h-80 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={intentChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a" opacity={0.15} horizontal={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="Triggers" radius={[0, 4, 4, 0]} barSize={14}>
                    {intentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
