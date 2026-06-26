'use client'

import { useEffect, useState, useRef } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Send,
  User,
  MessageCircle,
  Inbox,
  CheckCircle,
  Activity,
  ChevronRight,
  Shield,
} from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  sender: 'user' | 'instagram_user' | 'ai'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  workspace_id: string
  instagram_user_id: string
  status: 'active' | 'pending' | 'resolved'
  created_at: string
  last_message?: string
  last_message_at?: string
}

export default function InboxPage() {
  const { activeWorkspace } = useWorkspace()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    if (!activeWorkspace) return
    setLoadingConv(true)
    setError(null)
    try {
      const { data: convData, error: dbError } = await supabase
        .from('conversations')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError

      // Fetch the last message for each conversation
      const convsWithLastMsg = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...conv,
            last_message: msgData && msgData.length > 0 ? msgData[0].content : 'No messages yet',
            last_message_at: msgData && msgData.length > 0 ? msgData[0].created_at : conv.created_at,
          }
        })
      )

      // Sort conversations by last message timestamp descending
      convsWithLastMsg.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )

      setConversations(convsWithLastMsg)

      if (convsWithLastMsg.length > 0 && !activeConv) {
        setActiveConv(convsWithLastMsg[0])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversations')
    } finally {
      setLoadingConv(false)
    }
  }

  // 2. Fetch Messages for Active Conversation
  const fetchMessages = async (convId: string) => {
    setLoadingMsg(true)
    try {
      const { data, error: dbError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (dbError) throw dbError
      setMessages(data || [])
    } catch (err: any) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoadingMsg(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [activeWorkspace])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id)
    } else {
      setMessages([])
    }
  }, [activeConv])

  // 3. Supabase Realtime Subscription for Live DMs
  useEffect(() => {
    if (!activeWorkspace) return

    const channel = supabase
      .channel('inbox-live-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as Message

          // Check if this message belongs to any conversation in the list
          const matchedConv = conversations.find(c => c.id === newMsg.conversation_id)

          if (matchedConv) {
            // Update last message in local state
            setConversations(prev => {
              const updated = prev.map(c => 
                c.id === newMsg.conversation_id
                  ? { ...c, last_message: newMsg.content, last_message_at: newMsg.created_at }
                  : c
              )
              // Resort list
              return updated.sort(
                (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
              )
            })

            // If it's the currently selected conversation, add to messages list
            if (activeConv && newMsg.conversation_id === activeConv.id) {
              setMessages(prev => [...prev, newMsg])
            }
          } else {
            // New conversation event (or conversation created during webhook)
            // Reload conversations list to capture the new channel
            await fetchConversations()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeWorkspace, conversations, activeConv])

  // 4. Send Message via API Route
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConv || !inputText.trim() || sending) return

    const messageText = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeConv.id,
          content: messageText,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // Outbound message is inserted in DB, which triggers our postgres realtime hook.
      // In case Realtime delay occurs, optimistically insert it here:
      if (data.message && !messages.some(m => m.id === data.message.id)) {
        setMessages(prev => [...prev, data.message])
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // 5. Update Conversation Status
  const handleUpdateStatus = async (status: 'active' | 'resolved') => {
    if (!activeConv) return
    try {
      const { error: dbError } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', activeConv.id)

      if (dbError) throw dbError

      setActiveConv(prev => (prev ? { ...prev, status } : null))
      setConversations(prev =>
        prev.map(c => (c.id === activeConv.id ? { ...c, status } : c))
      )
    } catch (err: any) {
      console.error('Failed to update status:', err)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.instagram_user_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Instagram Inbox
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chat in real-time, view logs, and manage customer interactions.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/35 rounded-xl shrink-0">
          {error}
        </div>
      )}

      {/* INBOX CHAT WINDOW LAYOUT */}
      <div className="flex-1 min-h-0 glass-panel rounded-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* COLUMN 1: CONVERSATIONS LIST */}
        <div className="w-full md:w-80 border-r border-border/60 flex flex-col bg-muted/10 shrink-0">
          {/* Search bar */}
          <div className="p-4 border-b border-border/40">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user ID..."
                className="w-full pl-9 pr-3 py-1.5 glass-input rounded-lg text-xs placeholder-muted-foreground transition-colors"
              />
            </div>
          </div>

          {/* Conversations list container */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loadingConv ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-5 h-5 border-2 border-indigo-650/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-[10px] text-muted-foreground animate-pulse">Fetching threads...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map(conv => {
                const isActive = activeConv?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-muted/40 cursor-pointer ${
                      isActive ? 'bg-muted/65' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground font-semibold text-xs shrink-0 shadow-inner">
                      {conv.instagram_user_id.slice(-2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate">
                          User {conv.instagram_user_id.substring(0, 8)}...
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {conv.last_message_at 
                            ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''
                          }
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">
                        {conv.last_message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[8px] font-semibold px-1.5 py-0.2 rounded-full border ${
                          conv.status === 'active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Inbox className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <span className="text-[10px] text-muted-foreground">No active conversations.</span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: ACTIVE CHAT WINDOW */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/5">
          {activeConv ? (
            <>
              {/* Chat Window Header */}
              <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between shrink-0 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold text-xs">
                    {activeConv.instagram_user_id.slice(-2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Instagram User (ID: {activeConv.instagram_user_id})</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Status: {activeConv.status}</p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {activeConv.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      className="flex items-center gap-1 py-1 px-2.5 bg-card border border-border rounded-md text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve Thread
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus('active')}
                      className="flex items-center gap-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-900/30 rounded-md text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Reopen Thread
                    </button>
                  )}
                </div>
              </div>

              {/* Message History list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMsg ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-indigo-655/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map(msg => {
                    const isFromClient = msg.sender === 'instagram_user'
                    const isFromAI = msg.sender === 'ai'
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromClient ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                      >
                        <div className="max-w-[70%] space-y-1">
                          <div className={`px-4 py-2.5 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-sm ${
                            isFromClient
                              ? 'bg-muted/80 text-foreground rounded-tl-sm border border-border/60'
                              : isFromAI
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-200 rounded-tr-sm border border-indigo-200 dark:border-indigo-900/30'
                              : 'bg-gradient-to-br from-[#B41DE6] to-[#0052cc] text-white rounded-tr-sm'
                          }`}>
                            {msg.content}
                          </div>
                          
                          <div className={`flex items-center gap-1.5 text-[9px] text-muted-foreground px-1 ${
                            isFromClient ? 'justify-start' : 'justify-end'
                          }`}>
                            <span className="capitalize">{msg.sender === 'user' ? 'agent' : msg.sender === 'ai' ? 'AI Agent' : 'client'}</span>
                            <span>•</span>
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isFromClient && isFromAI && (
                              <>
                                <span>•</span>
                                <span title="Automated Reply">
                                  <Shield className="w-3 h-3 text-indigo-650 dark:text-indigo-400" />
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    No messages in this conversation.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input area */}
              <div className="p-4 border-t border-border/40 bg-muted/10 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type a manual response..."
                    className="flex-1 px-4 py-2 glass-input rounded-xl text-xs placeholder-muted-foreground transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 text-muted-foreground/60 mb-3" />
              <h3 className="font-bold text-foreground text-sm">Select a Conversation</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Choose a customer thread from the sidebar to review message history and reply manually.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
