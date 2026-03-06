"use client"

import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { useState, useEffect, useRef } from "react"
import { 
  Search, Edit3, Send, Paperclip, CheckCheck, Loader2, Smile
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MemberSelector } from "@/components/ui/member-selector"

interface UserProfile {
  id: string
  name: string
  email: string
  profile_image?: string
}

interface Conversation {
  id: string
  title: string
  participants: string[]
  created_at: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      if (user) {
        fetchUsers()
        fetchConversations(user.id)
      } else {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('id, name, email, profile_image')
    if (data) setAllUsers(data)
  }

  async function fetchConversations(userId: string) {
    // Array overlap to find conversations where user is a participant
    // using contains array operator.
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [userId])
      .order('created_at', { ascending: false })
      
    if (data) setConversations(data)
    setLoading(false)
  }

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
    } else {
      setMessages([])
    }
  }, [activeConversation])

  async function fetchMessages(conversationId: string) {
    const { data } = await supabase
      .from('conversations_messages')
      .select('*')
      .eq('parent_conversation', conversationId)
      .order('created_at', { ascending: true })
      
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        content: m.message,
        sender_id: m.user_from,
        created_at: m.created_at
      })))
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !activeConversation || !currentUser) return
    
    const txt = messageText.trim()
    setMessageText("") // optimistic clear
    
    // Create new conversation if this happens to be a shell (id starts with new_)
    let convId = activeConversation.id
    if (convId.startsWith('new_')) {
       // Insert actual conversation
       const { data: convData, error: convErr } = await supabase
         .from('conversations')
         .insert([{
            title: activeConversation.title,
            participants: activeConversation.participants,
            user_admin_creator: currentUser.id
         }])
         .select()
         .single()
         
       if (convErr) {
         console.error(convErr)
         return
       }
       if (convData) {
         convId = convData.id
         setActiveConversation(convData)
         fetchConversations(currentUser.id) // update sidebar
       }
    }
    
    // Insert message
    const { data: msgData, error: msgErr } = await supabase
      .from('conversations_messages')
      .insert([{
         parent_conversation: convId,
         message: txt,
         user_from: currentUser.id,
      }])
      .select()
      .single()
      
    if (msgErr) {
      console.error(msgErr)
    } else if (msgData) {
      setMessages(prev => [...prev, {
        id: msgData.id,
        content: msgData.message,
        sender_id: msgData.user_from,
        created_at: msgData.created_at
      }])
    }
  }

  const startNewChat = () => {
    // Create a temporary conversation shell 
    const tempConv: Conversation = {
      id: "new_" + Date.now(),
      title: "New Conversation",
      participants: currentUser ? [currentUser.id] : [],
      created_at: new Date().toISOString()
    }
    setActiveConversation(tempConv)
  }

  const handleMembersChange = (selectedIds: string[]) => {
    if (!activeConversation) return
    
    const allPar = Array.from(new Set([...(currentUser ? [currentUser.id] : []), ...selectedIds]))
    
    // Update local state early
    setActiveConversation({
      ...activeConversation,
      participants: allPar,
      // dynamically generate title from names if no custom title
      title: "Chat with " + allPar.map(id => allUsers.find(u => u.id === id)?.name?.split(' ')[0] || 'Unknown').filter(n => n !== (currentUser?.email || 'me')).join(', ')
    })
    
    // If it's saved already, update DB
    if (!activeConversation.id.startsWith('new_')) {
      supabase.from('conversations')
        .update({ participants: allPar })
        .eq('id', activeConversation.id)
        .then(() => fetchConversations(currentUser?.id))
    }
  }

  // Find user detail helper
  const getUserData = (id: string) => allUsers.find(u => u.id === id) || { name: 'Unknown User', profile_image: '' }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50 shadow-2xl">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <TopHeader />

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar: Chat List */}
          <div className="w-full md:w-[380px] h-full flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-md">
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black font-heading tracking-tighter">Messages</h2>
                <div className="flex gap-2">
                   <button onClick={startNewChat} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-[var(--color-brand-muted)] hover:text-white transition-all"><Edit3 size={18} /></button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-white/50"/></div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">No conversations yet.</div>
              ) : conversations.map((conv) => {
                // Determine a display name based on participants excluding self
                const otherParticipants = conv.participants.filter(p => p !== currentUser?.id)
                let displayTitle = conv.title
                let displayAvatar = "https://ui-avatars.com/api/?name=Chat&background=random"
                
                if (otherParticipants.length === 1) {
                  const u = getUserData(otherParticipants[0])
                  displayTitle = u.name
                  displayAvatar = u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
                } else if (otherParticipants.length > 1) {
                  displayTitle = "Group Chat (" + (otherParticipants.length + 1) + ")"
                }

                return (
                  <div 
                    key={conv.id} 
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 mx-3 my-1 rounded-lg flex items-center gap-4 cursor-pointer transition-all border border-transparent ${activeConversation?.id === conv.id ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/20 shadow-lg' : 'hover:bg-white/5'}`}
                  >
                    <div className="relative shrink-0">
                      <img src={displayAvatar} className="w-12 h-12 rounded-lg object-cover shadow-xl border border-white/5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                         <h4 className="font-bold text-white text-sm truncate">{displayTitle}</h4>
                      </div>
                      <p className="text-[11px] text-[var(--color-brand-muted)] truncate font-medium">{conv.participants.length} Participant(s)</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Chat Area */}
          {activeConversation ? (
            <div className="hidden md:flex flex-1 flex-col bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              
              {/* Chat Header */}
              <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 z-10 shadow-lg">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white mb-0.5">{activeConversation.title}</h3>
                    <p className="text-[11px] text-[var(--color-brand-neon)] font-medium">Active now</p>
                  </div>
                  
                  <div className="flex items-center">
                    <MemberSelector
                      members={allUsers.map(u => ({
                        id: u.id,
                        name: u.name || u.email,
                        email: u.email,
                        role: "User",
                        avatar: u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=random`
                      }))}
                      selected={activeConversation.participants}
                      onChange={handleMembersChange}
                      maxVisible={4}
                      className="origin-right"
                    />
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
              >
                {activeConversation.id.startsWith('new_') && (
                  <div className="text-center p-8 text-white/40 text-sm">
                    Select members at the top right to start a new conversation.
                  </div>
                )}
              
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUser?.id
                  const sender = getUserData(msg.sender_id)
                  
                  return (
                    <div key={msg.id} className={`flex items-end gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <img 
                        src={sender.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name)}&background=random`} 
                        className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" 
                      />
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <span className="text-[10px] text-[var(--color-brand-muted)] font-bold mb-1 ml-1">{sender.name || 'Unknown'}</span>}
                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed relative group ${isMe ? 'bg-[var(--color-brand-violet)] text-white rounded-br-none shadow-[0_4px_15px_rgba(138,43,226,0.3)]' : 'bg-[#1A1A1A] text-white border border-white/5 rounded-bl-none shadow-lg'}`}>
                          {msg.content}
                          <span className={`text-[9px] opacity-60 mt-2 block ${isMe ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                <form 
                  onSubmit={handleSendMessage}
                  className="bg-[var(--color-brand-surface-1)] border border-white/10 rounded-2xl flex items-end gap-2 p-2 shadow-2xl focus-within:border-[var(--color-brand-violet)]/50 transition-colors"
                >
                  <button type="button" className="p-3 text-[var(--color-brand-muted)] hover:text-white transition-colors"><Paperclip size={20} /></button>
                  <textarea 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 max-h-32 text-sm text-white placeholder-[var(--color-brand-muted)] outline-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                  <button type="button" className="p-3 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-neon)] transition-colors"><Smile size={20} /></button>
                  <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-3 bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(138,43,226,0.4)] m-1"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center flex-col bg-black/20 relative overflow-hidden">
               <div className="w-[400px] h-[400px] bg-[var(--color-brand-violet)]/5 rounded-full blur-[100px] absolute pointer-events-none" />
               <div className="w-24 h-24 rounded-3xl bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                  <Send size={40} className="text-[var(--color-brand-muted)] ml-2" />
               </div>
               <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">Your Messages</h3>
               <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium text-center">Select a conversation or start a new one to securely chat with talent and partners.</p>
               <button onClick={startNewChat} className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)]">
                  Start New Chat
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
