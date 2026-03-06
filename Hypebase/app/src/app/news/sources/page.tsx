"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Globe, Plus, Filter, Search, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, Bookmark,
  MoreVertical, ChevronUp, Newspaper, Building2
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { NewsSourceDrawer } from "@/components/directory-drawers"

interface NewsSource {
  id: string
  name: string
  url: string
  logo_url: string
  description: string
  status: string
}

export default function NewsSourcesDirectory() {
  const router = useRouter()
  const [sources, setSources] = useState<NewsSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedSource, setSelectedSource] = useState<NewsSource | null>(null)
  
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
    router.push(`/dashboard/news/sources/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        const countQuery = supabase
          .from("news_sources")
          .select("id", { count: "exact", head: true })
        
        if (filterKeyword) countQuery.ilike('name', `%${filterKeyword}%`)
        if (filterStatus) countQuery.eq('status', filterStatus)
        
        const { count } = await countQuery
        if (count !== null) setTotalCount(count)

        let query = supabase
          .from("news_sources")
          .select("*")
        
        if (filterKeyword) query = query.ilike('name', `%${filterKeyword}%`)
        if (filterStatus) query = query.eq('status', filterStatus)
        
        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setSources([])
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
          setSources(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setSources([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, filterKeyword, filterStatus])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">News Sources</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Manage authoritative media outlets, blogs, and industry feed providers.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Verified Sources', value: '184', icon: CheckCircle2, growth: '+2%' },
                      { label: 'Pending Review', value: '12', icon: Clock, growth: '-5%' },
                      { label: 'Daily Scrapes', value: '1.2k', icon: Globe, growth: '+15%' },
                      { label: 'API Integrations', value: '8', icon: Building2, growth: 'Steady' }
                    ].map((card, i) => (
                      <BudgetCard 
                        key={i}
                        title={card.label}
                        amount={card.value}
                        icon={card.icon}
                        trendLabel={card.growth}
                        trend={card.growth && card.growth.includes('-') ? 'down' : card.growth && card.growth.includes('Steady') ? 'neutral' : 'up'}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={18} />
                      <input 
                        type="text" 
                        value={filterKeyword}
                        onChange={(e) => { setFilterKeyword(e.target.value); setPage(1) }}
                        placeholder="Search sources, providers..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')} className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white transition-all shadow-sm">
                        {viewType === 'grid' ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
                      </button>
                      <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      <Link href="/dashboard/news/sources/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Register Source
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

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Keyword Search */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Search</label>
                            <button onClick={() => { setFilterKeyword(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input type="text" value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }} placeholder="Source name..." className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)]" />
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
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] pointer-events-none" size={14} />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <button onClick={() => { setFilterKeyword(''); setFilterStatus(''); setPage(1); }} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-sm transition-all active:scale-95">
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
                  viewType === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10" : "space-y-4"
                }>
                  {isLoading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-white/5 p-4 rounded-lg border border-white/5 h-48" />
                    ))
                  ) : sources.length > 0 ? (
                    sources.map((source) => (
                      <div key={source.id} onClick={() => setSelectedSource(source)} className={`group bg-[var(--color-brand-surface-1)] border border-white/5 p-6 rounded-lg hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer shadow-xl relative ${viewType === 'list' ? 'flex items-center gap-6' : 'flex flex-col items-center text-center'}`}>
                         <div className={`${viewType === 'list' ? 'w-16 h-16' : 'w-24 h-24 mb-6'} rounded-lg bg-white/5 border border-white/5 p-4 flex items-center justify-center`}>
                           <img 
                              src={source.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(source.name)}&background=random&size=200`} 
                              className="max-w-full max-h-full object-contain filter group-hover:brightness-125 transition-all" 
                           />
                         </div>
                         <div className={`flex-1 min-w-0 ${viewType === 'grid' ? 'flex flex-col items-center' : ''}`}>
                            <h4 className="font-heading text-lg font-bold text-white mb-1 truncate w-full">{source.name}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--color-brand-muted)] font-black uppercase tracking-widest mb-4">
                               <span className="flex items-center gap-1"><Globe size={12} className="text-[var(--color-brand-violet)]" /> {source.url ? new URL(source.url).hostname : 'Source Link'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(source.id, e)} className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)] z-20">
                                 <Edit2 size={14} />
                               </button>
                               <Link href={source.url || '#'} target="_blank" onPointerDown={(e) => e.stopPropagation()} onClick={e => e.stopPropagation()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all z-20">
                                 <ExternalLink size={14} />
                               </Link>
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-lg bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <Globe size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No sources registered</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Add news outlets and websites to feed the Hypebase media engine.</p>
                       <Link href="/dashboard/news/sources/new"><button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">Register First Source</button></Link>
                    </div>
                  )}
                </div>

                {sources.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={sources.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
         <NewsSourceDrawer 
           isOpen={!!selectedSource} 
           onClose={() => setSelectedSource(null)} 
           data={selectedSource} 
         />
      </div>
    </div>
  )
}

const Clock = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
