'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Save, HelpCircle, MessageSquare, ToggleLeft, ToggleRight, Clock, RefreshCw, CheckCircle2, Trash2, Plus, AlertTriangle } from 'lucide-react'

export default function AIAgentPage() {
  const { activeWorkspace } = useWorkspace()

  const [aiEnabled, setAiEnabled] = useState(true)
  const [respondOnDms, setRespondOnDms] = useState(true)
  const [respondOnComments, setRespondOnComments] = useState(true)
  const [replyDelay, setReplyDelay] = useState(0)

  const [greetingKeywords, setGreetingKeywords] = useState('')
  const [greetingResponse, setGreetingResponse] = useState('')

  const [pricingKeywords, setPricingKeywords] = useState('')
  const [pricingResponse, setPricingResponse] = useState('')

  const [productKeywords, setProductKeywords] = useState('')
  const [productResponse, setProductResponse] = useState('')

  const [supportKeywords, setSupportKeywords] = useState('')
  const [supportResponse, setSupportResponse] = useState('')

  const [unknownResponse, setUnknownResponse] = useState('')
  const [customIntents, setCustomIntents] = useState<{ id: string; name: string; keywords: string; response: string }[]>([])

  const addCustomIntent = () => {
    setCustomIntents([
      ...customIntents,
      {
        id: Math.random().toString(),
        name: '',
        keywords: '',
        response: '',
      },
    ])
  }

  const removeCustomIntent = (id: string) => {
    setCustomIntents(customIntents.filter(ci => ci.id !== id))
  }

  const updateCustomIntent = (id: string, field: 'name' | 'keywords' | 'response', value: string) => {
    setCustomIntents(
      customIntents.map(ci => (ci.id === id ? { ...ci, [field]: value } : ci))
    )
  }

  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const [confirmToggleActive, setConfirmToggleActive] = useState<{
    type: 'ai_enabled' | 'respond_on_comments' | 'respond_on_dms';
    currentVal: boolean;
    name: string;
  } | null>(null)

  const handleToggleActiveSetting = async (type: 'ai_enabled' | 'respond_on_comments' | 'respond_on_dms', currentVal: boolean) => {
    const newVal = !currentVal
    if (type === 'ai_enabled') {
      setAiEnabled(newVal)
    } else if (type === 'respond_on_comments') {
      setRespondOnComments(newVal)
    } else if (type === 'respond_on_dms') {
      setRespondOnDms(newVal)
    }

    if (!activeWorkspace) return
    try {
      const cleanKeywords = (str: string) => 
        str.split(',').map(k => k.trim()).filter(Boolean)

      const preparedCustomIntents = customIntents
        .map((ci) => ({
          id: ci.id,
          name: ci.name.trim(),
          keywords: cleanKeywords(ci.keywords),
          response: ci.response.trim(),
        }))
        .filter((ci) => ci.name && ci.response)

      const { error: upsertError } = await supabase
        .from('ai_settings')
        .upsert({
          workspace_id: activeWorkspace.id,
          ai_enabled: type === 'ai_enabled' ? newVal : aiEnabled,
          respond_on_dms: type === 'respond_on_dms' ? newVal : respondOnDms,
          respond_on_comments: type === 'respond_on_comments' ? newVal : respondOnComments,
          reply_delay_seconds: replyDelay,
          
          greeting_keywords: cleanKeywords(greetingKeywords),
          greeting_response: greetingResponse,
          
          pricing_keywords: cleanKeywords(pricingKeywords),
          pricing_response: pricingResponse,
          
          product_keywords: cleanKeywords(productKeywords),
          product_response: productResponse,
          
          support_keywords: cleanKeywords(supportKeywords),
          support_response: supportResponse,
          
          unknown_response: unknownResponse,
          custom_intents: preparedCustomIntents,
        }, {
          onConflict: 'workspace_id',
        })

      if (upsertError) throw upsertError
      setSuccess(`${type === 'ai_enabled' ? 'AI Agent' : type === 'respond_on_dms' ? 'Response to DMs' : 'Response to Comments'} status updated successfully.`)
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    }
  }

  const fetchSettings = async () => {
    if (!activeWorkspace) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .single()

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError
      }

      if (data) {
        setAiEnabled(data.ai_enabled ?? true)
        setRespondOnDms(data.respond_on_dms ?? true)
        setRespondOnComments(data.respond_on_comments ?? true)
        setReplyDelay(data.reply_delay_seconds ?? 0)

        setGreetingKeywords((data.greeting_keywords || []).join(', '))
        setGreetingResponse(data.greeting_response || '')

        setPricingKeywords((data.pricing_keywords || []).join(', '))
        setPricingResponse(data.pricing_response || '')

        setProductKeywords((data.product_keywords || []).join(', '))
        setProductResponse(data.product_response || '')

        setSupportKeywords((data.support_keywords || []).join(', '))
        setSupportResponse(data.support_response || '')

        setUnknownResponse(data.unknown_response || '')
        
        const loadedCustoms = (data.custom_intents || []).map((ci: any) => ({
          id: ci.id || Math.random().toString(),
          name: ci.name || '',
          keywords: Array.isArray(ci.keywords) ? ci.keywords.join(', ') : '',
          response: ci.response || ''
        }))
        setCustomIntents(loadedCustoms)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI Agent configurations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [activeWorkspace])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || saveLoading) return

    setSaveLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const cleanKeywords = (str: string) => 
        str.split(',').map(k => k.trim()).filter(Boolean)

      const preparedCustomIntents = customIntents
        .map((ci) => ({
          id: ci.id,
          name: ci.name.trim(),
          keywords: cleanKeywords(ci.keywords),
          response: ci.response.trim(),
        }))
        .filter((ci) => ci.name && ci.response)

      const { error: upsertError } = await supabase
        .from('ai_settings')
        .upsert({
          workspace_id: activeWorkspace.id,
          ai_enabled: aiEnabled,
          respond_on_dms: respondOnDms,
          respond_on_comments: respondOnComments,
          reply_delay_seconds: replyDelay,
          
          greeting_keywords: cleanKeywords(greetingKeywords),
          greeting_response: greetingResponse,
          
          pricing_keywords: cleanKeywords(pricingKeywords),
          pricing_response: pricingResponse,
          
          product_keywords: cleanKeywords(productKeywords),
          product_response: productResponse,
          
          support_keywords: cleanKeywords(supportKeywords),
          support_response: supportResponse,
          
          unknown_response: unknownResponse,
          custom_intents: preparedCustomIntents,
        }, {
          onConflict: 'workspace_id',
        })

      if (upsertError) throw upsertError

      setSuccess('AI Agent configurations updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Loading AI settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            AI Auto-Responder Agent
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure intent-based NLP triggers and automatic fallback flows for your Instagram messages.
          </p>
        </div>

        {/* Master AI Agent Toggle */}
        <button
          type="button"
          onClick={() => setConfirmToggleActive({ type: 'ai_enabled', currentVal: aiEnabled, name: 'AI Agent Active' })}
          title={aiEnabled ? 'Deactivate' : 'Activate'}
          className="cursor-pointer focus:outline-none text-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">AI Agent Active</span>
            <div className={`w-14 h-7 rounded-full border-2 flex items-center relative transition-all duration-300 select-none ${
              aiEnabled 
                ? 'border-emerald-500/80 bg-emerald-500/5' 
                : 'border-red-500/80 bg-red-500/5'
            }`}>
              <span className={`text-[8px] font-extrabold tracking-wider absolute transition-all duration-300 ${
                aiEnabled 
                  ? 'left-2 text-emerald-600 dark:text-emerald-400 opacity-100' 
                  : 'right-2 text-red-650 dark:text-red-400 opacity-100'
              }`}>
                {aiEnabled ? 'ON' : 'OFF'}
              </span>
              <div className={`w-4 h-4 rounded-full absolute left-1 transition-all duration-300 ${
                aiEnabled 
                  ? 'translate-x-7 bg-emerald-500 dark:bg-emerald-400 shadow-sm' 
                  : 'translate-x-0 bg-red-500 dark:bg-red-400 shadow-sm'
              }`} />
            </div>
          </div>
        </button>
      </div>

      {/* Notices */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-650 dark:text-red-400 text-xs rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/35 text-emerald-750 dark:text-emerald-400 text-xs rounded-xl">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Row 1: Agent Routing Preferences */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* DM Channel Selection */}
          <div 
            className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between h-32 transition-all select-none ${
              respondOnDms && aiEnabled
                ? 'border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-950/5 shadow-indigo-500/5' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">DM Responses</span>
              <button
                type="button"
                onClick={() => setConfirmToggleActive({ type: 'respond_on_dms', currentVal: respondOnDms, name: 'Response to DMs' })}
                title={respondOnDms ? 'Deactivate' : 'Activate'}
                className="cursor-pointer focus:outline-none"
              >
                <div className={`w-14 h-7 rounded-full border-2 flex items-center relative transition-all duration-300 select-none ${
                  respondOnDms 
                    ? 'border-emerald-500/80 bg-emerald-500/5' 
                    : 'border-red-500/80 bg-red-500/5'
                }`}>
                  <span className={`text-[8px] font-extrabold tracking-wider absolute transition-all duration-300 ${
                    respondOnDms 
                      ? 'left-2 text-emerald-600 dark:text-emerald-400 opacity-100' 
                      : 'right-2 text-red-650 dark:text-red-400 opacity-100'
                  }`}>
                    {respondOnDms ? 'ON' : 'OFF'}
                  </span>
                  <div className={`w-4 h-4 rounded-full absolute left-1 transition-all duration-300 ${
                    respondOnDms 
                      ? 'translate-x-7 bg-emerald-500 dark:bg-emerald-400 shadow-sm' 
                      : 'translate-x-0 bg-red-500 dark:bg-red-400 shadow-sm'
                  }`} />
                </div>
              </button>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Respond to DMs</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Triggers fallback replies inside Direct Message threads.</p>
            </div>
          </div>

          {/* Comment Channel Selection */}
          <div 
            className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between h-32 transition-all select-none ${
              respondOnComments && aiEnabled
                ? 'border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-950/5 shadow-indigo-500/5' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Comment Responses</span>
              <button
                type="button"
                onClick={() => setConfirmToggleActive({ type: 'respond_on_comments', currentVal: respondOnComments, name: 'Response to Comments' })}
                title={respondOnComments ? 'Deactivate' : 'Activate'}
                className="cursor-pointer focus:outline-none"
              >
                <div className={`w-14 h-7 rounded-full border-2 flex items-center relative transition-all duration-300 select-none ${
                  respondOnComments 
                    ? 'border-emerald-500/80 bg-emerald-500/5' 
                    : 'border-red-500/80 bg-red-500/5'
                }`}>
                  <span className={`text-[8px] font-extrabold tracking-wider absolute transition-all duration-300 ${
                    respondOnComments 
                      ? 'left-2 text-emerald-600 dark:text-emerald-400 opacity-100' 
                      : 'right-2 text-red-650 dark:text-red-400 opacity-100'
                  }`}>
                    {respondOnComments ? 'ON' : 'OFF'}
                  </span>
                  <div className={`w-4 h-4 rounded-full absolute left-1 transition-all duration-300 ${
                    respondOnComments 
                      ? 'translate-x-7 bg-emerald-500 dark:bg-emerald-400 shadow-sm' 
                      : 'translate-x-0 bg-red-500 dark:bg-red-400 shadow-sm'
                  }`} />
                </div>
              </button>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Respond to Comments</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Replies to post/reel comments & private-replies via DM.</p>
            </div>
          </div>

          {/* Delay dropdown setting */}
          <div className="glass-panel rounded-2xl p-5 border flex flex-col justify-between h-32">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Simulated Human Delay</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Response Delay</h4>
              <select
                disabled={!aiEnabled}
                value={replyDelay}
                onChange={e => setReplyDelay(Number(e.target.value))}
                className="w-full mt-1.5 py-1 px-2.5 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value={0}>Instant (No delay)</option>
                <option value={2}>2 Seconds</option>
                <option value={5}>5 Seconds</option>
                <option value={10}>10 Seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Intent Configs */}
        <div className={`space-y-6 transition-opacity ${!aiEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Card 1: Greetings config */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. Greeting Intent</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-foreground">Trigger Keywords</label>
                <p className="text-[10px] text-muted-foreground">Comma-separated triggers that launch greeting responses.</p>
                <input
                  type="text"
                  required={aiEnabled}
                  value={greetingKeywords}
                  onChange={e => setGreetingKeywords(e.target.value)}
                  placeholder="hi, hello, hey, yo"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-foreground">AI Response Template</label>
                <textarea
                  required={aiEnabled}
                  rows={3}
                  value={greetingResponse}
                  onChange={e => setGreetingResponse(e.target.value)}
                  placeholder="Hello! 👋 How can we help you today?"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pricing config */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. Pricing Intent</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-foreground">Trigger Keywords</label>
                <p className="text-[10px] text-muted-foreground">Comma-separated triggers relating to product costs, fees, or buying.</p>
                <input
                  type="text"
                  required={aiEnabled}
                  value={pricingKeywords}
                  onChange={e => setPricingKeywords(e.target.value)}
                  placeholder="price, cost, plan, buy"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-foreground">AI Response Template</label>
                <textarea
                  required={aiEnabled}
                  rows={3}
                  value={pricingResponse}
                  onChange={e => setPricingResponse(e.target.value)}
                  placeholder="Our plan starts at just $29/mo! Let me know if you would like a link to join."
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Product Info config */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">3. Product Info Intent</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-foreground">Trigger Keywords</label>
                <p className="text-[10px] text-muted-foreground">Comma-separated keywords relating to features, what this tool does, etc.</p>
                <input
                  type="text"
                  required={aiEnabled}
                  value={productKeywords}
                  onChange={e => setProductKeywords(e.target.value)}
                  placeholder="product, features, details, tool"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-foreground">AI Response Template</label>
                <textarea
                  required={aiEnabled}
                  rows={3}
                  value={productResponse}
                  onChange={e => setProductResponse(e.target.value)}
                  placeholder="Namma.ai is an intelligent automation platform designed to scale conversations."
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Support Request config */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">4. Support Intent</h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-foreground">Trigger Keywords</label>
                <p className="text-[10px] text-muted-foreground">Comma-separated keywords requesting agent assistance, support, or errors.</p>
                <input
                  type="text"
                  required={aiEnabled}
                  value={supportKeywords}
                  onChange={e => setSupportKeywords(e.target.value)}
                  placeholder="help, support, contact, human"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-foreground">AI Response Template</label>
                <textarea
                  required={aiEnabled}
                  rows={3}
                  value={supportResponse}
                  onChange={e => setSupportResponse(e.target.value)}
                  placeholder="We have logged your support request, and an agent will be with you shortly. 🛠️"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Fallback config */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">5. Default Fallback (Unknown Intent)</h4>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">AI Response Template</label>
              <p className="text-[10px] text-muted-foreground">Triggered when incoming messages do not match any configured keywords.</p>
              <textarea
                required={aiEnabled}
                rows={3}
                value={unknownResponse}
                onChange={e => setUnknownResponse(e.target.value)}
                placeholder="Thanks for reaching out! We will review your message and get back to you soon."
                className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
              />
            </div>
          </div>

          {/* Custom Options Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Custom Trigger Options
                </h3>
                <p className="text-muted-foreground text-[10px] mt-1">
                  Define your own intents, keywords, and automated replies for specific business queries.
                </p>
              </div>
              <button
                type="button"
                onClick={addCustomIntent}
                disabled={!aiEnabled}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Option
              </button>
            </div>

            {customIntents.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center border border-dashed border-border/50 bg-zinc-50/5 dark:bg-zinc-950/5">
                <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-foreground">No Custom Options Yet</h4>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click the &quot;Add Custom Option&quot; button above to create custom AI responders for specialized queries (e.g. coupon codes, locations).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customIntents.map((custom, index) => (
                  <div key={custom.id} className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-indigo-500/10 bg-indigo-50/5 dark:bg-indigo-950/2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                      <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={custom.name}
                          onChange={(e) => updateCustomIntent(custom.id, 'name', e.target.value)}
                          placeholder="e.g. Promo Codes"
                          className="w-full bg-transparent font-bold text-foreground text-xs uppercase tracking-wider focus:outline-none border-b border-transparent focus:border-indigo-500/30"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomIntent(custom.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete custom option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-1 space-y-2">
                        <label className="text-xs font-semibold text-foreground">Trigger Keywords</label>
                        <p className="text-[10px] text-muted-foreground">Comma-separated triggers for this option.</p>
                        <input
                          type="text"
                          required
                          value={custom.keywords}
                          onChange={(e) => updateCustomIntent(custom.id, 'keywords', e.target.value)}
                          placeholder="promo, discount, sale, coupon"
                          className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-foreground">AI Response Template</label>
                        <textarea
                          required
                          rows={3}
                          value={custom.response}
                          onChange={(e) => updateCustomIntent(custom.id, 'response', e.target.value)}
                          placeholder="Use code SAVE15 at checkout to receive 15% off your order!"
                          className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Action button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saveLoading}
            className="flex items-center gap-1.5 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-600/15 cursor-pointer animate-float"
          >
            {saveLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving AI configurations...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save AI Configurations
              </>
            )}
          </button>
        </div>

      </form>
      {/* Confirmation Modal for Active Toggle */}
      {confirmToggleActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-zinc-800/85 animate-in zoom-in-95 duration-200 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 animate-pulse ${
                confirmToggleActive.currentVal
                  ? 'bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-400'
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400'
              }`}>
                {confirmToggleActive.currentVal ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {confirmToggleActive.currentVal ? `Deactivate ${confirmToggleActive.name}` : `Activate ${confirmToggleActive.name}`}
              </h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
                Are you sure you want to {confirmToggleActive.currentVal ? 'deactivate' : 'activate'} <strong className="text-zinc-850 dark:text-zinc-100 font-semibold">{confirmToggleActive.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-8 w-full">
              <button
                type="button"
                onClick={() => setConfirmToggleActive(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleActiveSetting(confirmToggleActive.type, confirmToggleActive.currentVal)
                  setConfirmToggleActive(null)
                }}
                className={`flex-1 py-3 px-4 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  confirmToggleActive.currentVal
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-550 hover:to-red-450 shadow-red-500/15 hover:shadow-red-500/25'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-550 hover:to-emerald-450 shadow-emerald-500/15 hover:shadow-emerald-500/25'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
