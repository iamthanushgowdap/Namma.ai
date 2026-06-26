'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import { Cpu, Zap, Plus, Trash2, ToggleLeft, ToggleRight, MessageSquare, RefreshCw, AlertTriangle, AlertCircle, Grid, Image, Instagram, CheckCircle2, Lock } from 'lucide-react'

interface AutomationRule {
  id: string
  automation_id: string
  keyword: string
  response_message: string
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
  created_at: string
  automation_rules: AutomationRule[]
}

export default function AutomationsPage() {
  const { activeWorkspace } = useWorkspace()
  
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // New Automation Form State
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
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
    } else {
      setMediaScope('all')
      setSelectedMediaId(null)
      setSelectedMediaUrl(null)
      setSelectedMediaPermalink(null)
    }
  }, [showForm, activeWorkspace])

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspace || !name || !keyword || !responseMessage) return

    if (mediaScope === 'specific' && !selectedMediaId) {
      setError('Please select a specific Instagram post for this automation.')
      return
    }

    setFormLoading(true)
    setError(null)
    try {
      // 1. Insert Automation head
      const { data: autoData, error: autoError } = await supabase
        .from('automations')
        .insert({
          workspace_id: activeWorkspace.id,
          name: name,
          trigger_type: 'comment_keyword',
          status: 'active',
          media_id: mediaScope === 'specific' ? selectedMediaId : null,
          media_permalink: mediaScope === 'specific' ? selectedMediaPermalink : null,
          media_thumbnail_url: mediaScope === 'specific' ? selectedMediaUrl : null,
          follow_gate_enabled: followGateEnabled,
          follow_gate_message: followGateMessage,
        })
        .select()
        .single()

      if (autoError) throw autoError

      // 2. Insert Automation Rule
      const { error: ruleError } = await supabase
        .from('automation_rules')
        .insert({
          automation_id: autoData.id,
          keyword: keyword.trim(),
          response_message: responseMessage.trim(),
        })

      if (ruleError) throw ruleError

      // Reset form
      setName('')
      setKeyword('')
      setResponseMessage('')
      setMediaScope('all')
      setSelectedMediaId(null)
      setSelectedMediaUrl(null)
      setSelectedMediaPermalink(null)
      setFollowGateEnabled(false)
      setFollowGateMessage('This link is exclusive for our followers only! Tap the button below to verify your follow and get instant access.')
      setShowForm(false)
      
      // Refresh list
      await fetchAutomations()
    } catch (err: any) {
      setError(err.message || 'Failed to create automation rule')
    } finally {
      setFormLoading(false)
    }
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
            onClick={() => setShowForm(true)}
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

      {/* NEW AUTOMATION FORM */}
      {showForm && (
        <div className="glass-panel rounded-2xl p-6 max-w-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Create Instagram Automation
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateAutomation} className="space-y-4">
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
                <select className="w-full px-3.5 py-2 glass-input rounded-lg text-sm transition-colors">
                  <option value="comment_keyword" className="bg-background text-foreground">Comment contains keyword</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Keyword Trigger</label>
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="e.g., price, cost, details"
                  className="w-full px-3.5 py-2 glass-input rounded-lg text-sm placeholder-muted-foreground transition-colors"
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
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Automated DM Response Message</label>
              <textarea
                required
                rows={4}
                value={responseMessage}
                onChange={e => setResponseMessage(e.target.value)}
                placeholder="Hey 👋 thanks for reaching out. Here is our product details: namma.ai..."
                className="w-full px-3.5 py-2 glass-input rounded-lg text-sm placeholder-muted-foreground transition-colors resize-none"
              />
            </div>

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

            <button
              type="submit"
              disabled={formLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-600/15 cursor-pointer self-end"
            >
              {formLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Save Automation'
              )}
            </button>
          </form>
        </div>
      )}

      {/* AUTOMATION LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.length > 0 ? (
          automations.map(auto => {
            const rule = auto.automation_rules[0]
            const isActive = auto.status === 'active'
            
            return (
              <div
                key={auto.id}
                className={`glass-panel rounded-2xl p-6 transition-all ${
                  isActive ? 'border-border/80 hover:border-indigo-500/25' : 'opacity-60'
                }`}
              >
                <div className="flex items-start justify-between border-b border-border/40 pb-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground text-sm truncate">{auto.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Trigger: Comment contains <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">&quot;{rule?.keyword}&quot;</strong>
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(auto.id, auto.status)}
                      title={isActive ? 'Deactivate' : 'Activate'}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isActive ? (
                        <ToggleRight className="w-8 h-8 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-muted-foreground/60" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(auto.id)}
                      title="Delete"
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/85" />
                      Auto DM Payload
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-line">
                      {rule?.response_message || 'No response message configured.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Type: comment_keyword</span>
                    <span>Created {new Date(auto.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 text-center bg-muted/10 border border-dashed border-border rounded-2xl">
            <Cpu className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="font-bold text-foreground text-sm">No automation rules configured</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 px-4">
              Add comment triggers to automate your Instagram account&apos;s marketing replies and capture leads in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
