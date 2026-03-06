"use client"

import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { useState, useEffect } from "react"
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, 
  Plus, Image as ImageIcon, Video, Link as LinkIcon,
  Newspaper, Calendar, TrendingUp, Users,
  ExternalLink, Bookmark, Clock, X
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageUploadDemo } from "@/components/ui/image-upload-demo"

interface FeedItem {
  id: string
  type: 'news' | 'event' | 'post'
  title: string
  content?: string
  image_url?: string
  author: string
  author_avatar?: string
  created_at: string
  likes: number
  comments: number
  category?: string
  source?: string
}

export default function MyFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string>("https://ui-avatars.com/api/?name=U&background=random")

  useEffect(() => {
    fetchFeed()
    fetchUserAvatar()
  }, [])

  async function fetchUserAvatar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("users").select("profile_image").eq("id", user.id).single()
      if (data?.profile_image) {
        setUserAvatar(data.profile_image)
      }
    }
  }

  async function fetchFeed() {
    setIsLoading(true)
    // Fetch news articles as base for feed
    const { data: news } = await supabase
      .from("news_articles")
      .select("*, source:news_sources(name, logo_url)")
      .order("published_at", { ascending: false })
      .limit(10)

    if (news) {
      const feedItems: FeedItem[] = news.map(n => ({
        id: n.id,
        type: 'news',
        title: n.title,
        content: n.author || 'Editorial Team',
        image_url: n.image_url,
        author: n.source?.name || 'Hypebase News',
        author_avatar: n.source?.logo_url || 'https://ui-avatars.com/api/?name=HB&background=random',
        created_at: n.published_at,
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        category: n.category,
        source: n.content_url
      }))
      setItems(feedItems)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <TopHeader />

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-[1400px] w-full mx-auto flex gap-10 p-8">
            
            {/* Main Feed Column */}
            <div className="flex-1 max-w-4xl space-y-8 pb-20">
               
               {/* Create Post Box */}
               <div className="bg-[#09090b] border border-white/10 rounded-lg p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-4 mb-6">
                     <img src={userAvatar} className="w-12 h-12 rounded-lg object-cover ring-2 ring-white/10 shrink-0" alt="User Profile" />
                     <input 
                        type="text" 
                        placeholder="What's on your mind? Share an update..." 
                        className="flex-1 bg-white/5 border border-white/5 rounded-lg px-6 py-3.5 text-sm text-white placeholder:text-[var(--color-brand-muted)] hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-violet)] transition-all font-medium"
                     />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[var(--color-brand-muted)] hover:text-white hover:bg-white/5 transition-all"><ImageIcon size={16} className="text-blue-500" /> Photo</button>
                        <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[var(--color-brand-muted)] hover:text-white hover:bg-white/5 transition-all"><Video size={16} className="text-purple-500" /> Video</button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[var(--color-brand-muted)] hover:text-white hover:bg-white/5 transition-all"><Calendar size={16} className="text-orange-500" /> Event</button>
                     </div>
                     <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">POST</button>
                  </div>
               </div>

               {/* Feed Items */}
               {isLoading ? (
                  <div className="space-y-6">
                     {[1,2,3].map(i => (
                        <div key={i} className="h-96 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
                     ))}
                  </div>
               ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#09090b] border border-white/10 rounded-lg text-center h-96">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Newspaper size={24} className="text-[var(--color-brand-muted)]" />
                     </div>
                     <h3 className="text-xl font-black text-white mb-2">No updates yet</h3>
                     <p className="text-sm text-[var(--color-brand-muted)] max-w-xs mx-auto mb-8">
                        When people in your network post updates or share news, they'll show up here.
                     </p>
                     <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-white transition-all">
                        Find People to Follow
                     </button>
                  </div>
               ) : (
                  items.map((item) => (
                    <div key={item.id} className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden shadow-2xl group transition-all hover:bg-white/[0.02]">
                       <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-4">
                                <img src={item.author_avatar} className="w-10 h-10 rounded-lg object-cover border border-white/10 p-0.5 bg-white/5" />
                                <div>
                                   <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-white tracking-tight">{item.author}</h4>
                                      <div className="w-1 h-1 rounded-full bg-[var(--color-brand-muted)]" />
                                      <span className="text-[10px] font-black text-[var(--color-brand-neon)] uppercase tracking-widest">{item.type}</span>
                                   </div>
                                   <p className="text-[10px] text-[var(--color-brand-muted)] flex items-center gap-1 font-bold mt-0.5">
                                      <Clock size={10} /> {new Date(item.created_at).toLocaleDateString()}
                                   </p>
                                </div>
                             </div>
                             <button className="text-[var(--color-brand-muted)] hover:text-white transition-colors p-2"><MoreHorizontal size={20} /></button>
                          </div>
                          
                          <h3 className="text-xl font-black font-heading tracking-tight mb-4 group-hover:text-[var(--color-brand-violet)] transition-colors line-clamp-2 leading-tight">
                             {item.title}
                          </h3>
                       </div>

                       {item.image_url && (
                          <div className="aspect-[16/9] w-full relative overflow-hidden bg-black/40 border-y border-white/10">
                             <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                             <div className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                                <Bookmark size={16} />
                             </div>
                          </div>
                       )}

                       <div className="p-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-red-500 transition-colors group/btn">
                                   <Heart size={20} className="group-hover/btn:fill-red-500 transition-all active:scale-125" />
                                   <span className="text-xs font-black">{item.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white transition-colors">
                                   <MessageCircle size={20} />
                                   <span className="text-xs font-black">{item.comments}</span>
                                </button>
                                <button className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white transition-colors">
                                   <Share2 size={20} />
                                </button>
                             </div>
                             {item.source && (
                                <a href={item.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-black text-[var(--color-brand-violet)] hover:underline uppercase tracking-widest leading-none">
                                   View Source <ExternalLink size={12} />
                                </a>
                             )}
                          </div>
                       </div>
                    </div>
                  ))
               )}
            </div>

            {/* Sidebar Columns */}
            <div className="hidden lg:block w-[320px] space-y-8 sticky top-8 h-fit">
               
               {/* Trending Section */}
               <div className="bg-[#09090b] border border-white/10 rounded-lg p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6">
                     <TrendingUp size={18} className="text-[var(--color-brand-neon)]" />
                     <h3 className="text-sm font-black uppercase tracking-[0.1em]">Trending Topics</h3>
                  </div>
                  <div className="space-y-4">
                     {[
                        { tag: '#HypebaseTour2026', count: '12k interactions' },
                        { tag: '#AIinMusic', count: '8.5k interactions' },
                        { tag: '#CoachellaLineup', count: '24k interactions' },
                        { tag: '#StreamingTrends', count: '4k interactions' }
                     ].map((trend, i) => (
                        <div key={i} className="group cursor-pointer">
                           <p className="text-sm font-bold text-white group-hover:text-[var(--color-brand-violet)] transition-colors">{trend.tag}</p>
                           <p className="text-[10px] text-[var(--color-brand-muted)] font-black uppercase tracking-widest mt-0.5">{trend.count}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Who to Follow */}
               <div className="bg-[#09090b] border border-white/10 rounded-lg p-6 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-6">
                     <Users size={18} className="text-[var(--color-brand-violet)]" />
                     <h3 className="text-sm font-black uppercase tracking-[0.1em]">Network Suggested</h3>
                  </div>
                  <div className="space-y-6">
                     {[
                        { name: 'Sarah Jenkins', role: 'A&R Executive', avatar: 'https://ui-avatars.com/api/?name=SJ&background=random' },
                        { name: 'Mike Ross', role: 'Artist Manager', avatar: 'https://ui-avatars.com/api/?name=MR&background=random' },
                        { name: 'Olivia West', role: 'Concert Promoter', avatar: 'https://ui-avatars.com/api/?name=OW&background=random' }
                     ].map((user, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <img src={user.avatar} className="w-10 h-10 rounded-lg object-cover ring-2 ring-white/5" />
                              <div className="min-w-0">
                                 <p className="text-xs font-black text-white truncate leading-none mb-1">{user.name}</p>
                                 <p className="text-[9px] text-[var(--color-brand-muted)] font-bold truncate tracking-widest uppercase">{user.role}</p>
                              </div>
                           </div>
                           <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]"><Plus size={14} /></button>
                        </div>
                     ))}
                  </div>
                  <button className="w-full mt-6 py-3 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10 transition-all">View Entire Network</button>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowUploadModal(false)} 
              className="absolute -top-12 right-0 p-2.5 text-white/50 hover:text-white bg-[#09090b] rounded-full shadow-2xl border border-white/10 transition-all hover:scale-110 active:scale-95"
            >
              <X size={18} />
            </button>
            <ImageUploadDemo />
          </div>
        </div>
      )}
    </div>
  )
}
