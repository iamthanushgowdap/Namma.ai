'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import { 
  Cpu, 
  Zap, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  MessageSquare, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  Grid, 
  Image as ImageIcon, 
  Instagram, 
  CheckCircle2, 
  Lock, 
  Edit2, 
  Copy, 
  Search, 
  ArrowUpDown 
} from 'lucide-react'

interface CardButton {
  title: string
  url: string
}

interface ResponseCard {
  image_url: string
  title: string
  subtitle?: string
  buttons: CardButton[]
}

interface AutomationRule {
  id: string
  automation_id: string
  keyword: string
  response_message: string
  image_url?: string | null
  response_cards?: ResponseCard[] | null
}

interface Automation {
  id: string
  workspace_id: string
  name: string
  trigger_type: string
  status: string
  media_id?: string | null
  media_permalink?: string | null
  media_thumbnail_url?: string | null
  follow_gate_enabled: boolean
  follow_gate_message: string
  same_for_next: boolean
  created_at: string
  automation_rules: AutomationRule[]
}

export default function AutomationsPage() {
  const { activeWorkspace } = useWorkspace()
  
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // New/Edit Automation Form State
  const [showForm, setShowForm] = useState(false)
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('comment_keyword')
  const [keyword, setKeyword] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  
  // Multi-Card Carousel State
  const [responseType, setResponseType] = useState<'standard' | 'carousel'>('standard')
  const [cards, setCards] = useState<ResponseCard[]>([])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null) // null for standard, number for card index
  const [uploadingStandard, setUploadingStandard] = useState(false)

  const [formLoading, setFormLoading] = useState(false)

  // Specific Post Selection State
  const [mediaScope, setMediaScope] = useState<'all' | 'specific'>('all')
  const [mediaList, setMediaList] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null)
  const [selectedMediaPermalink, setSelectedMediaPermalink] = useState<string | null>(null)

  // Follow-Gate State
  const [followGateEnabled, setFollowGateEnabled] = useState(false)
  const [followGateMessage, setFollowGateMessage] = useState('This link is exclusive for our followers only! Tap the button below to verify your follow and get instant access.')

  // Same for Next Post State
  const [sameForNext, setSameForNext] = useState(false)

  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status-active' | 'status-inactive'>('newest')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: timeFormat === '12h',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      setLiveTime(formatter.format(now))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timeFormat])

  // Toggle Confirmation State
  const [confirmToggleAuto, setConfirmToggleAuto] = useState<{ id: string; status: string; name: string } | null>(null)

  const supabase = createClient()

  const fetchAutomations = async () => {
    if (!activeWorkspace) return
    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('automations')
        .select('*, automation_rules(*)')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setAutomations(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load automations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAutomations()
  }, [activeWorkspace])

  // Fetch Instagram posts when new automation form is opened
  useEffect(() => {
    if (showForm && activeWorkspace) {
      setMediaLoading(true)
      fetch(`/api/instagram/media?workspaceId=${activeWorkspace.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.media) {
            setMediaList(data.media)
          }
        })
        .catch(err => console.error('Failed to load Instagram media:', err))
        .finally(() => setMediaLoading(false))
    }
  }, [showForm, activeWorkspace])

  const handleImageUpload = async (file: File, cardIndex?: number) => {
    if (!activeWorkspace) return
    
    if (cardIndex !== undefined) {
      setUploadingIndex(cardIndex)
    } else {
      setUploadingStandard(true)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', activeWorkspace.id)

    try {
      const res = await fetch('/api/automations/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (cardIndex !== undefined) {
        setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, image_url: data.url } : c))
      } else {
        setImageUrl(data.url)
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Unknown error'}`)
    } finally {
      setUploadingIndex(null)
      setUploadingStandard(false)
    }
  }

  const handleCreateOrUpdateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !name || (triggerType !== 'comment_any' && !keyword)) return

    if (mediaScope === 'specific' && !selectedMediaId) {
      setError('Please select a specific Instagram post for this automation.')
      return
    }

    if (responseType === 'carousel' && cards.length === 0) {
      setError('Please add at least one card to your carousel.')
      return
    }

    // Validate cards
    if (responseType === 'carousel') {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        if (!card.title || !card.image_url) {
          setError(`Card #${i + 1} must have a title and an image.`)
          return
        }
        if (card.buttons.length === 0) {
          setError(`Card #${i + 1} must have at least one button.`)
          return
        }
        for (let j = 0; j < card.buttons.length; j++) {
          const btn = card.buttons[j]
          if (!btn.title || !btn.url) {
            setError(`Button #${j + 1} in Card #${i + 1} must have text and a URL link.`)
            return
          }
        }
      }
    }

    setFormLoading(true)
    setError(null)
    try {
      if (editingAutomationId) {
        // --- EDIT MODE ---
        // 1. Update Automation record
        const { error: autoError } = await supabase
          .from('automations')
          .update({
            name: name,
            trigger_type: triggerType,
            media_id: mediaScope === 'specific' ? selectedMediaId : null,
            media_permalink: mediaScope === 'specific' ? selectedMediaPermalink : null,
            media_thumbnail_url: mediaScope === 'specific' ? selectedMediaUrl : null,
            follow_gate_enabled: followGateEnabled,
            follow_gate_message: followGateMessage,
            same_for_next: mediaScope === 'specific' ? sameForNext : false,
          })
          .eq('id', editingAutomationId)

        if (autoError) throw autoError

        // 2. Update Automation Rule
        const { error: ruleError } = await supabase
          .from('automation_rules')
          .update({
            keyword: triggerType === 'comment_any' ? '*' : keyword.trim(),
            response_message: responseMessage.trim(),
            image_url: responseType === 'standard' ? (imageUrl.trim() || null) : null,
            response_cards: responseType === 'carousel' ? cards : [],
          })
          .eq('automation_id', editingAutomationId)

        if (ruleError) throw ruleError
      } else {
        // --- CREATE MODE ---
        // 1. Insert Automation record
        const { data: autoData, error: autoError } = await supabase
          .from('automations')
          .insert({
            workspace_id: activeWorkspace.id,
            name: name,
            trigger_type: triggerType,
            status: 'active',
            media_id: mediaScope === 'specific' ? selectedMediaId : null,
            media_permalink: mediaScope === 'specific' ? selectedMediaPermalink : null,
            media_thumbnail_url: mediaScope === 'specific' ? selectedMediaUrl : null,
            follow_gate_enabled: followGateEnabled,
            follow_gate_message: followGateMessage,
            same_for_next: mediaScope === 'specific' ? sameForNext : false,
          })
          .select()
          .single()

        if (autoError) throw autoError

        // 2. Insert Automation Rule
        const { error: ruleError } = await supabase
          .from('automation_rules')
          .insert({
            automation_id: autoData.id,
            keyword: triggerType === 'comment_any' ? '*' : keyword.trim(),
            response_message: responseMessage.trim(),
            image_url: responseType === 'standard' ? (imageUrl.trim() || null) : null,
            response_cards: responseType === 'carousel' ? cards : [],
          })

        if (ruleError) throw ruleError
      }

      // Reset form fields
      resetFormState()
      
      // Refresh list
      await fetchAutomations()
    } catch (err: any) {
      setError(err.message || 'Failed to save automation rule')
    } finally {
      setFormLoading(false)
    }
  }

  const resetFormState = () => {
    setName('')
    setTriggerType('comment_keyword')
    setKeyword('')
    setResponseMessage('')
    setImageUrl('')
    setResponseType('standard')
    setCards([])
    setUploadingIndex(null)
    setUploadingStandard(false)
    setMediaScope('all')
    setSelectedMediaId(null)
    setSelectedMediaUrl(null)
    setSelectedMediaPermalink(null)
    setFollowGateEnabled(false)
    setFollowGateMessage('This link is exclusive for our followers only! Tap the button below to verify your follow and get instant access.')
    setSameForNext(false)
    setEditingAutomationId(null)
    setShowForm(false)
  }

  const startEdit = (auto: Automation) => {
    const rule = auto.automation_rules?.[0]
    setEditingAutomationId(auto.id)
    setName(auto.name)
    setTriggerType(auto.trigger_type || 'comment_keyword')
    setKeyword(rule?.keyword === '*' ? '' : rule?.keyword || '')
    setResponseMessage(rule?.response_message || '')
    setImageUrl(rule?.image_url || '')

    const responseCards = rule?.response_cards || []
    if (Array.isArray(responseCards) && responseCards.length > 0) {
      setResponseType('carousel')
      setCards(responseCards)
    } else {
      setResponseType('standard')
      setCards([])
    }

    setMediaScope(auto.media_id ? 'specific' : 'all')
    setSelectedMediaId(auto.media_id || null)
    setSelectedMediaUrl(auto.media_thumbnail_url || null)
    setSelectedMediaPermalink(auto.media_permalink || null)
    setFollowGateEnabled(auto.follow_gate_enabled)
    setFollowGateMessage(auto.follow_gate_message)
    setSameForNext(auto.same_for_next || false)
    setShowForm(true)
  }

  const startClone = (auto: Automation) => {
    const rule = auto.automation_rules?.[0]
    setEditingAutomationId(null) // Creating a new record
    setName(`Copy of ${auto.name}`)
    setTriggerType(auto.trigger_type || 'comment_keyword')
    setKeyword(rule?.keyword === '*' ? '' : rule?.keyword || '')
    setResponseMessage(rule?.response_message || '')
    setImageUrl(rule?.image_url || '')

    const responseCards = rule?.response_cards || []
    if (Array.isArray(responseCards) && responseCards.length > 0) {
      setResponseType('carousel')
      setCards(responseCards)
    } else {
      setResponseType('standard')
      setCards([])
    }

    setMediaScope(auto.media_id ? 'specific' : 'all')
    setSelectedMediaId(auto.media_id || null)
    setSelectedMediaUrl(auto.media_thumbnail_url || null)
    setSelectedMediaPermalink(auto.media_permalink || null)
    setFollowGateEnabled(auto.follow_gate_enabled)
    setFollowGateMessage(auto.follow_gate_message)
    setSameForNext(auto.same_for_next || false)
    setShowForm(true)
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    // Optimistic Update
    setAutomations(prev =>
      prev.map(auto => (auto.id === id ? { ...auto, status: nextStatus } : auto))
    )

    try {
      const { error: updateError } = await supabase
        .from('automations')
        .update({ status: nextStatus })
        .eq('id', id)

      if (updateError) throw updateError
    } catch (err: any) {
      setError(err.message || 'Failed to update automation status')
      // Revert on error
      fetchAutomations()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule? This action cannot be undone.')) return

    try {
      const { error: deleteError } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      
      setAutomations(prev => prev.filter(auto => auto.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete automation')
    }
  }

  // Filter and Sort Automations list
  const filteredAndSortedAutomations = automations
    .filter(auto => {
      const rule = auto.automation_rules?.[0]
      const query = searchQuery.toLowerCase()
      return (
        auto.name.toLowerCase().includes(query) ||
        (rule?.keyword || '').toLowerCase().includes(query) ||
        (rule?.response_message || '').toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === 'status-active') {
        if (a.status === b.status) return 0
        return a.status === 'active' ? -1 : 1
      }
      if (sortBy === 'status-inactive') {
        if (a.status === b.status) return 0
        return a.status === 'inactive' ? -1 : 1
      }
      return 0
    })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400">Loading automation rules...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Automations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build triggers that instantly reply to Instagram comments and send direct messages.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetFormState(); setShowForm(true); }}
            className="flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-indigo-600/15"
          >
            <Plus className="w-4 h-4" />
            New Automation
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-650 dark:text-red-400 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* NEW/EDIT AUTOMATION FORM */}
      {showForm && (
        <div className="glass-panel rounded-2xl p-6 max-w-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              {editingAutomationId ? 'Edit Instagram Automation' : 'Create Instagram Automation'}
            </h3>
            <button
              onClick={resetFormState}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateOrUpdateAutomation} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Automation Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Pricing Information Trigger"
                className="w-full px-3.5 py-2 glass-input rounded-lg text-sm placeholder-muted-foreground transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Trigger Type</label>
                <select
                  value={triggerType}
                  onChange={e => setTriggerType(e.target.value)}
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <option value="comment_keyword" className="bg-background text-foreground">Comment contains keyword</option>
                  <option value="comment_any" className="bg-background text-foreground">Any comment (No keyword filter)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Keyword Trigger</label>
                <input
                  type="text"
                  required={triggerType !== 'comment_any'}
                  disabled={triggerType === 'comment_any'}
                  value={triggerType === 'comment_any' ? 'Disabled — triggers on any comment' : keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder={triggerType === 'comment_any' ? 'Disabled — triggers on any comment' : 'e.g., price, cost, details (separate multiple by comma)'}
                  className={`w-full px-3.5 py-2 glass-input rounded-lg text-sm placeholder-muted-foreground transition-colors ${
                    triggerType === 'comment_any' ? 'opacity-50 cursor-not-allowed bg-zinc-100/5 dark:bg-zinc-800/5' : ''
                  }`}
                />
              </div>
            </div>

            {/* Post Target Selector */}
            <div className="space-y-3 p-4 bg-muted/30 border border-border/60 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  Target Posts
                </label>
                <div className="flex bg-muted p-0.5 rounded-lg border border-border/40 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setMediaScope('all')}
                    className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                      mediaScope === 'all'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaScope('specific')}
                    className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                      mediaScope === 'specific'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Select Specific Post
                  </button>
                </div>
              </div>

              {mediaScope === 'specific' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                      <span className="text-[10px] text-muted-foreground">Loading Instagram posts...</span>
                    </div>
                  ) : mediaList.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {mediaList.map((media) => {
                        const isSelected = selectedMediaId === media.id;
                        const thumbnail = media.thumbnailUrl || media.mediaUrl;
                        return (
                          <button
                            key={media.id}
                            type="button"
                            onClick={() => {
                              setSelectedMediaId(media.id);
                              setSelectedMediaUrl(thumbnail);
                              setSelectedMediaPermalink(media.permalink);
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'border-border/60 hover:border-muted-foreground/50'
                            }`}
                            title={media.caption || 'Instagram Post'}
                          >
                            <img src={thumbnail} alt={media.caption || 'Instagram post'} className="w-full h-full object-cover" />
                            {media.caption && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex flex-col justify-end text-[8px] text-left text-zinc-300 leading-tight">
                                <span className="line-clamp-2">{media.caption}</span>
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border rounded-lg">
                      <Instagram className="w-5 h-5 text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground">No Instagram posts found.</p>
                    </div>
                  )}
                  {selectedMediaId && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-medium">
                      ✓ Post Selected (ID: {selectedMediaId.substring(0, 8)}...)
                    </p>
                  )}

                  {/* Same for Next Post Toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-3">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        Same for Next Post
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        Automatically copy this automation to the next post you publish on Instagram.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSameForNext(!sameForNext)}
                      className="cursor-pointer"
                    >
                      {sameForNext ? (
                        <ToggleRight className="w-9 h-9 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-muted-foreground/60" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* DM Response Type Selector */}
            <div className="space-y-1.5 border-b border-border/40 pb-4 mb-4">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                Response Type
              </label>
              <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60 max-w-xs text-xs">
                <button
                  type="button"
                  onClick={() => setResponseType('standard')}
                  className={`flex-1 py-1.5 font-medium rounded-lg transition-all cursor-pointer text-center ${
                    responseType === 'standard'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Standard DM
                </button>
                <button
                  type="button"
                  onClick={() => setResponseType('carousel')}
                  className={`flex-1 py-1.5 font-medium rounded-lg transition-all cursor-pointer text-center ${
                    responseType === 'carousel'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Interactive Cards
                </button>
              </div>
            </div>

            {responseType === 'standard' ? (
              <>
                {/* Photo Attachment URL Input (Upgraded with File Upload) */}
                <div className="space-y-3 p-4 bg-muted/30 border border-border/60 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      Photo Attachment (Optional)
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      Upload an image or provide a public URL to send a photo with your DM response.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer transition-all">
                      {uploadingStandard ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : imageUrl ? (
                        'Change Image'
                      ) : (
                        'Upload from Device'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                        disabled={uploadingStandard}
                      />
                    </label>
                  </div>

                  {imageUrl && imageUrl.trim().startsWith('http') && (
                    <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-border/60 mt-2 bg-black/5 dark:bg-black/20">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black text-white rounded-full p-1 shadow transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Automated DM Response Message (Text)</label>
                  <textarea
                    rows={4}
                    value={responseMessage}
                    onChange={e => setResponseMessage(e.target.value)}
                    placeholder="Hey 👋 thanks for reaching out. Here is our product details: namma.ai..."
                    className="w-full px-3.5 py-2 glass-input rounded-lg text-sm placeholder-muted-foreground transition-colors resize-none"
                  />
                </div>
              </>
            ) : (
              /* Carousel Card Builder */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-indigo-500" />
                    Cards Carousel ({cards.length}/10)
                  </label>
                  {cards.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setCards([...cards, { image_url: '', title: '', subtitle: '', buttons: [{ title: '', url: '' }] }])}
                      className="flex items-center gap-1 py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Card
                    </button>
                  )}
                </div>

                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-zinc-500/5">
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">No cards added to the carousel yet.</p>
                    <button
                      type="button"
                      onClick={() => setCards([{ image_url: '', title: '', subtitle: '', buttons: [{ title: '', url: '' }] }])}
                      className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add First Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {cards.map((card, cardIndex) => (
                      <div key={cardIndex} className="p-4 bg-muted/20 border border-border/85 rounded-xl space-y-4 relative">
                        {/* Remove Card Button */}
                        <button
                          type="button"
                          onClick={() => setCards(cards.filter((_, i) => i !== cardIndex))}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <span className="text-xs font-bold text-foreground block">Card #{cardIndex + 1}</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Card Inputs */}
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Card Title *</label>
                              <input
                                type="text"
                                maxLength={80}
                                required
                                value={card.title}
                                onChange={(e) => setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, title: e.target.value } : c))}
                                placeholder="e.g., Premium Hoodies Collection"
                                className="w-full px-3 py-1.5 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Card Subtitle (Optional)</label>
                              <input
                                type="text"
                                maxLength={80}
                                value={card.subtitle || ''}
                                onChange={(e) => setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, subtitle: e.target.value } : c))}
                                placeholder="e.g., Get up to 20% discount today!"
                                className="w-full px-3 py-1.5 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Card Image *</label>
                              <div className="flex gap-2">
                                <label className="flex-1 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer transition-all">
                                  {uploadingIndex === cardIndex ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : card.image_url ? (
                                    'Change Image'
                                  ) : (
                                    'Upload from Device'
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleImageUpload(file, cardIndex)
                                    }}
                                    disabled={uploadingIndex === cardIndex}
                                  />
                                </label>
                                {card.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, image_url: '' } : c))}
                                    className="px-3 py-2 bg-red-650/10 hover:bg-red-650/20 text-red-650 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Live 1.91:1 Crop Mockup Preview */}
                          <div className="flex flex-col items-center justify-center bg-zinc-950/5 dark:bg-zinc-950/20 p-3 rounded-lg border border-border/40">
                            <span className="text-[10px] font-semibold text-muted-foreground mb-2 self-start flex items-center gap-1">
                              <Instagram className="w-3 h-3 text-indigo-500" />
                              Instagram DM Card Preview
                            </span>
                            <div className="w-full max-w-[240px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                              {/* 1.91:1 Horizontal Image Preview */}
                              <div className="aspect-[1.91/1] w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                                {card.image_url && card.image_url.trim().startsWith('http') ? (
                                  <img
                                    src={card.image_url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
                                )}
                              </div>
                              <div className="p-3 space-y-1 text-left">
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-white block truncate">
                                  {card.title || 'Card Title'}
                                </span>
                                <span className="text-[9px] text-zinc-550 dark:text-zinc-400 block truncate">
                                  {card.subtitle || 'Card subtitle description'}
                                </span>
                                
                                {/* Mock buttons inside preview */}
                                {card.buttons.map((btn, btnIdx) => (
                                  <div key={btnIdx} className="mt-2 text-center py-1.5 bg-zinc-100/50 dark:bg-zinc-800/80 rounded-md border border-zinc-200/50 dark:border-zinc-700/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                                    {btn.title || `Button #${btnIdx + 1}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Buttons Builder */}
                        <div className="border-t border-border/40 pt-4 mt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Buttons ({card.buttons.length}/3)</span>
                            {card.buttons.length < 3 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedButtons = [...card.buttons, { title: '', url: '' }]
                                  setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, buttons: updatedButtons } : c))
                                }}
                                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
                              >
                                + Add Button
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {card.buttons.map((button, buttonIndex) => (
                              <div key={buttonIndex} className="p-2.5 bg-muted/40 border border-border/60 rounded-lg space-y-2 relative">
                                {card.buttons.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedButtons = card.buttons.filter((_, idx) => idx !== buttonIndex)
                                      setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, buttons: updatedButtons } : c))
                                    }}
                                    className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                <span className="text-[10px] font-bold text-muted-foreground block">Button #{buttonIndex + 1}</span>
                                
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    maxLength={20}
                                    required
                                    value={button.title}
                                    onChange={(e) => {
                                      const updatedButtons = card.buttons.map((btn, idx) => idx === buttonIndex ? { ...btn, title: e.target.value } : btn)
                                      setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, buttons: updatedButtons } : c))
                                    }}
                                    placeholder="Button Text (e.g., Shop Now)"
                                    className="w-full px-2.5 py-1 glass-input rounded-md text-[10px] placeholder-muted-foreground"
                                  />
                                  <input
                                    type="url"
                                    required
                                    value={button.url}
                                    onChange={(e) => {
                                      const updatedButtons = card.buttons.map((btn, idx) => idx === buttonIndex ? { ...btn, url: e.target.value } : btn)
                                      setCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, buttons: updatedButtons } : c))
                                    }}
                                    placeholder="Link URL (https://...)"
                                    className="w-full px-2.5 py-1 glass-input rounded-md text-[10px] placeholder-muted-foreground"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Follow-Gate Toggle */}
            <div className="space-y-3 p-4 bg-muted/30 border border-border/60 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                    Follow Gate
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Require users to follow your account before receiving the link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowGateEnabled(!followGateEnabled)}
                  className="cursor-pointer"
                >
                  {followGateEnabled ? (
                    <ToggleRight className="w-9 h-9 text-purple-500" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-muted-foreground/60" />
                  )}
                </button>
              </div>

              {followGateEnabled && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-muted-foreground">Follow-Gate Card Message</label>
                  <textarea
                    rows={3}
                    value={followGateMessage}
                    onChange={e => setFollowGateMessage(e.target.value)}
                    placeholder="This link is exclusive for our followers only! Tap the button below to verify..."
                    className="w-full px-3.5 py-2 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors resize-none"
                  />
                  <p className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
                    Users who are not following will see a &quot;Recheck&quot; button until they follow and verify.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={resetFormState}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                {formLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingAutomationId ? 'Update Automation' : 'Save Automation'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SORT CONTROLS */}
      {!showForm && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 border border-border/40 p-4 rounded-2xl">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search automations by name, keyword, or response..."
              className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-all"
            />
          </div>

          {/* Sort By selector & Live Clock */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 glass-input rounded-xl text-xs cursor-pointer focus:outline-none"
              >
                <option value="newest" className="bg-background text-foreground">Newly Added</option>
                <option value="oldest" className="bg-background text-foreground">Oldest First</option>
                <option value="name-asc" className="bg-background text-foreground">Name (A-Z)</option>
                <option value="name-desc" className="bg-background text-foreground">Name (Z-A)</option>
                <option value="status-active" className="bg-background text-foreground">Active First</option>
                <option value="status-inactive" className="bg-background text-foreground">Inactive First</option>
              </select>
            </div>

            {/* Live India clock & format selector */}
            <div className="flex items-center gap-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 py-1 px-3 rounded-xl">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">India Time (IST)</span>
                <span className="text-xs font-mono font-bold text-foreground/90">{liveTime}</span>
              </div>
              <div className="h-6 w-px bg-indigo-500/20" />
              <button
                type="button"
                onClick={() => setTimeFormat(prev => prev === '12h' ? '24h' : '12h')}
                className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-350 dark:hover:bg-zinc-700 text-[10px] font-black rounded-md transition-colors cursor-pointer text-foreground"
              >
                {timeFormat === '12h' ? '12H' : '24H'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATION LIST */}
      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedAutomations.length > 0 ? (
            filteredAndSortedAutomations.map(auto => {
              const rule = auto.automation_rules?.[0]
              const isActive = auto.status === 'active'
              
              return (
                <div
                  key={auto.id}
                  className={`glass-panel rounded-2xl p-6 transition-all border ${
                    isActive 
                      ? 'border-border/80 hover:border-indigo-500/25 shadow-sm' 
                      : 'border-border/30 opacity-60 shadow-none'
                  }`}
                >
                  <div className="flex items-start justify-between border-b border-border/40 pb-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground text-sm truncate">{auto.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {auto.trigger_type === 'comment_any' ? (
                          <span>Trigger: <strong className="text-indigo-650 dark:text-indigo-400 font-bold">Any comment</strong> (No keyword filter)</span>
                        ) : (
                          <span>Trigger: Comment contains <strong className="text-indigo-650 dark:text-indigo-400 font-semibold">&quot;{rule?.keyword}&quot;</strong></span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {auto.media_id ? (
                          <div className="flex items-center gap-1.5 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-md">
                            {auto.media_thumbnail_url && (
                              <img src={auto.media_thumbnail_url} alt="Post thumbnail" className="w-4.5 h-4.5 object-cover rounded-sm" />
                            )}
                            <span>Specific Post</span>
                            {auto.media_permalink && (
                              <a
                                href={auto.media_permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded-md">
                            All Posts
                          </div>
                        )}
                        {/* Follow-Gate Badge */}
                        {auto.follow_gate_enabled && (
                          <div className="text-[10px] flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 px-1.5 py-0.5 rounded-md font-medium">
                            <Lock className="w-2.5 h-2.5" />
                            Follow-Gated
                          </div>
                        )}
                        {/* Photo attachment indicator */}
                        {rule?.image_url && (
                          <div className="text-[10px] flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-md font-medium">
                            <ImageIcon className="w-2.5 h-2.5" />
                            Photo Included
                          </div>
                        )}
                        {/* Carousel template indicator */}
                        {Array.isArray(rule?.response_cards) && rule.response_cards.length > 0 && (
                          <div className="text-[10px] flex items-center gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-md font-medium">
                            <Grid className="w-2.5 h-2.5 text-indigo-500" />
                            {rule.response_cards.length} Cards Carousel
                          </div>
                        )}
                        {/* Same for Next Post Badge */}
                        {auto.same_for_next && (
                          <div className="text-[10px] flex items-center gap-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-md font-medium">
                            <Zap className="w-2.5 h-2.5 text-indigo-500" />
                            Same for Next
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setConfirmToggleAuto({ id: auto.id, status: auto.status, name: auto.name })}
                        title={isActive ? 'Deactivate' : 'Activate'}
                        className="cursor-pointer focus:outline-none"
                      >
                        <div className={`w-14 h-7 rounded-full border-2 flex items-center relative transition-all duration-300 select-none ${
                          isActive 
                            ? 'border-emerald-500/80 bg-emerald-500/5' 
                            : 'border-red-500/80 bg-red-500/5'
                        }`}>
                          <span className={`text-[8px] font-extrabold tracking-wider absolute transition-all duration-300 ${
                            isActive 
                              ? 'left-2 text-emerald-600 dark:text-emerald-400 opacity-100' 
                              : 'right-2 text-red-650 dark:text-red-400 opacity-100'
                          }`}>
                            {isActive ? 'ON' : 'OFF'}
                          </span>
                          <div className={`w-4 h-4 rounded-full absolute left-1 transition-all duration-300 ${
                            isActive 
                              ? 'translate-x-7 bg-emerald-500 dark:bg-emerald-400 shadow-sm' 
                              : 'translate-x-0 bg-red-500 dark:bg-red-400 shadow-sm'
                          }`} />
                        </div>
                      </button>
                      <button
                        onClick={() => startEdit(auto)}
                        title="Edit"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => startClone(auto)}
                        title="Clone Automation"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-purple-500 hover:bg-purple-500/10 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(auto.id)}
                        title="Delete"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Photo attachment display if present */}
                    {rule?.image_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-border/40 bg-zinc-950/20 flex items-center justify-center">
                        <img 
                          src={rule.image_url} 
                          alt="Attachment preview" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {Array.isArray(rule?.response_cards) && rule.response_cards.length > 0 ? (
                      <div className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase">
                          <Grid className="w-3.5 h-3.5 text-muted-foreground/85" />
                          Auto DM Carousel Payload
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                          {rule.response_cards.map((card, idx) => (
                            <div key={idx} className="flex-shrink-0 w-36 border border-border/60 rounded-md overflow-hidden bg-black/5 dark:bg-black/20 p-2 space-y-1.5 text-[10px]">
                              {card.image_url && (
                                <img src={card.image_url} alt={card.title} className="w-full aspect-[1.91/1] object-cover rounded" />
                              )}
                              <span className="font-bold text-foreground truncate block">{card.title}</span>
                              <span className="text-muted-foreground text-[8px] truncate block">{card.subtitle || '(No subtitle)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/85" />
                          Auto DM Payload
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-line">
                          {rule?.response_message || '(No text response configured — only photo will be sent)'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/20 pt-2">
                      <span>Type: comment_keyword</span>
                      <span>Created: {new Date(auto.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 text-center bg-muted/10 border border-dashed border-border rounded-2xl">
              <Cpu className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="font-bold text-foreground text-sm">
                {searchQuery ? 'No matching automations found' : 'No automation rules configured'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1.5 px-4">
                {searchQuery 
                  ? 'Try searching with a different name or keyword trigger.' 
                  : 'Add comment triggers to automate your Instagram account\'s marketing replies and capture leads in real-time.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TOGGLE CONFIRMATION MODAL */}
      {confirmToggleAuto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-zinc-800/85 animate-in zoom-in-95 duration-200 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 animate-pulse ${
                confirmToggleAuto.status === 'active'
                  ? 'bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-400'
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400'
              }`}>
                {confirmToggleAuto.status === 'active' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {confirmToggleAuto.status === 'active' ? 'Deactivate Automation' : 'Activate Automation'}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
                Are you sure you want to {confirmToggleAuto.status === 'active' ? 'deactivate' : 'activate'} the automation <strong className="text-zinc-850 dark:text-zinc-100 font-semibold">&quot;{confirmToggleAuto.name}&quot;</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-8 w-full">
              <button
                onClick={() => setConfirmToggleAuto(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(confirmToggleAuto.id, confirmToggleAuto.status)
                  setConfirmToggleAuto(null)
                }}
                className={`flex-1 py-3 px-4 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  confirmToggleAuto.status === 'active'
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
