"use client"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Newspaper, Plus, Filter, Search, Calendar, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, Bookmark, Share2,
  MoreVertical, ChevronUp, User, Globe
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { NewsArticleDrawer } from "@/components/directory-drawers"

interface NewsArticle {
  id: string
  title: string
  content_url: string
  published_at: string
  source_id: string
  image_url: string
  status: string
  author: string
  category: string
}

export default function NewsArticlesDirectory() {
  const router = useRouter()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("published_at")
  const [sortAsc, setSortAsc] = useState(false)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLikedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const navigateToEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/news/articles/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        const countQuery = supabase
          .from("news_articles")
          .select("id", { count: "exact", head: true })
        if (filterKeyword) countQuery.ilike('title', `%${filterKeyword}%`)
        if (filterCategory) countQuery.eq('category', filterCategory)
        if (filterStatus) countQuery.eq('status', filterStatus)
        
        const { count } = await countQuery
        if (count !== null) setTotalCount(count)

        let query = supabase
          .from("news_articles")
          .select("*")
        
        if (filterKeyword) query = query.ilike('title', `%${filterKeyword}%`)
        if (filterCategory) query = query.eq('category', filterCategory)
        if (filterStatus) query = query.eq('status', filterStatus)
        
        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setArticles([])
            setHasMore(false)
            setTotalCount(0)
            setIsLoading(false)
            return
          }
          query = query.in("id", likedIds)
        }

        const { data, error } = await query
          .order(sortField, { ascending: sortAsc })
          .range(from, to)
        
        if (data && data.length > 0) {
          setArticles(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setArticles([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, filterKeyword, filterCategory, filterStatus])

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
            <div className="max-w-[1400px] mx-auto">
                <div className="px-2 mb-10">
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">News Articles</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Curation of industry news, press releases, and media mentions.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Articles', value: '12,480', icon: Newspaper, growth: '+24%' },
                      { label: 'Daily Mentions', value: '42', icon: Share2, growth: '+5%' },
                      { label: 'Active Sources', value: '184', icon: Globe, growth: '+2%' },
                      { label: 'Reach Est.', value: '2.4M', icon: CheckCircle2, growth: '+18%' }
                    ].map((card, i) => (
                      <div key={i} className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-5 flex flex-col h-full shadow-lg group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[var(--color-brand-violet)] group-hover:scale-110 transition-transform">
                            <card.icon size={24} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto mb-2">
                           <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                           <span className="text-[11px] font-bold text-[var(--color-brand-neon)] bg-[var(--color-brand-neon)]/10 px-2 py-1 rounded flex items-center gap-1 leading-none">
                              <ChevronUp size={12} strokeWidth={3} /> {card.growth}
                           </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-brand-muted)] border-t border-white/5 pt-4 mt-2">{card.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={18} />
                      <input 
                        type="text" 
                        value={filterKeyword}
                        onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
                        placeholder="Search articles, authors..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3 relative" ref={filterRef}>
                      <button onClick={() => setSortAsc(!sortAsc)} className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white">
                        {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                      </button>
                      <button onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')} className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white">
                        {viewType === 'grid' ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
                      </button>
                      <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      <Link href="/dashboard/news/articles/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Publish Article
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Filter Panel - pushes content down */}
                {filterOpen && (
                  <div className="mb-8 px-2">
                    <div className="bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between p-5 border-b border-white/5">
                        <div className="flex items-center gap-2 font-heading font-bold text-[var(--color-brand-text)] text-base">
                          <Filter size={18} className="text-[var(--color-brand-violet)]" /> Filters
                        </div>
                        <button onClick={() => setFilterOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-white transition-colors">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Keyword Search */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Search</label>
                            <button onClick={() => { setFilterKeyword(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input type="text" value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }} placeholder="Article title..." className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)]" />
                          </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Category</label>
                            <button onClick={() => { setFilterCategory(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <div className="relative">
                            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="appearance-none w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)] cursor-pointer">
                              <option value="">All Categories</option>
                              <option value="Industry">Industry</option>
                              <option value="Product">Product</option>
                              <option value="Community">Community</option>
                              <option value="Media">Media</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] pointer-events-none" size={14} />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Status</label>
                            <button onClick={() => { setFilterStatus(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <div className="relative">
                            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="appearance-none w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)] cursor-pointer">
                              <option value="">All Statuses</option>
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] pointer-events-none" size={14} />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <button onClick={() => { setFilterKeyword(''); setFilterCategory(''); setFilterStatus(''); setPage(1); }} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-sm transition-all active:scale-95">
                          Reset All
                        </button>
                        <button 
                          onClick={() => setFilterOpen(false)}
                          className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)] text-sm"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className={
                  viewType === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8" : "space-y-4"
                }>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-white/5 p-6 rounded-2xl border border-white/5 h-80" />
                    ))
                  ) : articles.length > 0 ? (
                    articles.map((article) => (
                      <div key={article.id} onClick={() => setSelectedArticle(article)} className={`group bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg overflow-hidden hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer shadow-xl relative ${viewType === 'list' ? 'flex gap-6 p-4 items-center' : 'flex flex-col'}`}>
                         <div className={`${viewType === 'list' ? 'w-48 h-32 rounded-lg' : 'w-full aspect-video'} overflow-hidden bg-white/5 shrink-0`}>
                           <img 
                              src={article.image_url || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80`} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                           />
                         </div>
                         <div className={`p-6 flex-1 flex flex-col`}>
                            <div className="flex items-center gap-2 mb-3">
                               <span className="px-2 py-1 rounded bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] text-[10px] font-black uppercase tracking-widest">{article.category || 'Industry'}</span>
                               <span className="text-[10px] text-[var(--color-brand-muted)] font-bold uppercase tracking-widest">{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Just Now'}</span>
                            </div>
                            <h4 className="font-heading text-lg font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-[var(--color-brand-violet)] transition-colors">{article.title}</h4>
                            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                               <div className="flex items-center gap-2 text-[11px] text-[var(--color-brand-muted)] font-bold">
                                  <User size={12} className="text-[var(--color-brand-violet)]" /> {article.author || 'Editorial Team'}
                                </div>
                               <div className="flex items-center gap-2">
                                  <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => toggleLike(article.id, e)} className="p-1.5 hover:text-red-500 transition-colors z-20">
                                    <Heart size={16} className={likedIds.includes(article.id) ? "fill-red-500 text-red-500" : ""} />
                                  </button>
                                  <Link href={article.content_url || '#'} target="_blank" onClick={e => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="z-20">
                                    <ExternalLink size={16} className="hover:text-white transition-colors" />
                                  </Link>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-lg bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <Newspaper size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No articles published</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Start publishing news articles and media mentions to track your reach.</p>
                       <Link href="/dashboard/news/articles/new"><button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">New Publication</button></Link>
                    </div>
                  )}
                </div>

                {articles.length > 0 && (
                  <div className="flex items-center justify-center gap-4 py-10 mt-12 border-t border-white/5 font-bold">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 disabled:opacity-20"><ChevronLeft /></button>
                    <span className="bg-white/5 px-4 py-1 rounded-xl border border-white/5">{page}</span>
                    <button onClick={() => setPage(page + 1)} disabled={!hasMore} className="p-2 disabled:opacity-20"><ChevronRight /></button>
                  </div>
                )}
            </div>
         </div>
         <NewsArticleDrawer 
           isOpen={!!selectedArticle} 
           onClose={() => setSelectedArticle(null)} 
           data={selectedArticle} 
         />
      </div>
    </div>
  )
}
