"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Calendar, Plus, Filter, Search, MapPin, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, CalendarDays, Ticket,
  MoreVertical, ChevronUp, Clock
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { EventDrawer } from "@/components/directory-drawers"

interface EventProfile {
  id: string
  title: string
  about: string
  status: string
  image: string
  address: string
  spotify_date: string
  spotify_venue_name: string
  spotify_location_name: string
}

export default function EventsDirectory() {
  const router = useRouter()
  const [events, setEvents] = useState<EventProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("spotify_date")
  const [sortAsc, setSortAsc] = useState(false)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterVenue, setFilterVenue] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedEvent, setSelectedEvent] = useState<EventProfile | null>(null)
  
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
    router.push(`/dashboard/events/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        // Fetch total count
        let countQuery = supabase
          .from("event_profiles")
          .select("id", { count: "exact", head: true })
        if (filterKeyword) countQuery = countQuery.ilike('title', `%${filterKeyword}%`)
        if (filterVenue) countQuery = countQuery.ilike('spotify_venue_name', `%${filterVenue}%`)
        if (filterLocation) countQuery = countQuery.ilike('spotify_location_name', `%${filterLocation}%`)
        
        const { count } = await countQuery
        if (count !== null) setTotalCount(count)

        // Fetch main data
        let query = supabase
          .from("event_profiles")
          .select("*")
        
        if (filterKeyword) query = query.ilike('title', `%${filterKeyword}%`)
        if (filterVenue) query = query.ilike('spotify_venue_name', `%${filterVenue}%`)
        if (filterLocation) query = query.ilike('spotify_location_name', `%${filterLocation}%`)
        
        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setEvents([])
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
          setEvents(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setEvents([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, filterKeyword, filterVenue, filterLocation])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Events Directory</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Manage and browse global events, festivals, and venue listings.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Upcoming Events', value: '1,240', icon: CalendarDays, growth: '+12%' },
                      { label: 'Total RSVPs', value: '45.2k', icon: Ticket, growth: '+8%' },
                      { label: 'Venues Listed', value: '312', icon: MapPin, growth: '+5%' },
                      { label: 'Est. Revenue', value: '$840k', icon: Calendar, growth: '+15%' }
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
                        placeholder="Search events, venues..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative" ref={filterRef}>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSortAsc(!sortAsc); setPage(1) }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                          title={sortAsc ? "Ascending" : "Descending"}
                        >
                          {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </button>
                        <div className="relative" ref={sortRef}>
                          <button 
                            onClick={() => setSortOpen(!sortOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-semibold transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                          >
                            <SlidersHorizontal size={16} /> 
                            <span>Sort By</span>
                            <ChevronDown size={14} className="ml-1 opacity-60" />
                          </button>
                          {sortOpen && (
                            <div className="absolute top-12 left-0 w-44 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden text-sm font-semibold animate-in fade-in zoom-in-95 duration-200">
                              {[
                                { label: "Event Date", val: "spotify_date" },
                                { label: "Title", val: "title" },
                                { label: "Last Modified", val: "updated_at" }
                              ].map(opt => (
                                <button 
                                  key={opt.val}
                                  onClick={() => { setSortField(opt.val); setSortOpen(false); setPage(1) }}
                                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${sortField === opt.val ? "text-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/10" : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]"}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => { setShowLikedOnly(!showLikedOnly); setPage(1) }}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${showLikedOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Heart size={18} className={showLikedOnly ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      <div className="flex items-center p-1 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg">
                        {[
                          { id: 'grid', icon: LayoutGrid },
                          { id: 'medium', icon: LayoutList },
                          { id: 'list', icon: List }
                        ].map(type => (
                          <button 
                            key={type.id}
                            onClick={() => setViewType(type.id as any)}
                            className={`p-1.5 rounded-lg transition-all ${viewType === type.id ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
                          >
                             <type.icon size={16} />
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      
                      <Link href="/dashboard/events/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add Event
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Filter Panel - pushes content down */}
                {filterOpen && (
                  <div className="mb-8">
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
                            <input type="text" value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }} placeholder="Event title..." className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)]" />
                          </div>
                        </div>

                        {/* Venue */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Venue</label>
                            <button onClick={() => { setFilterVenue(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <input type="text" value={filterVenue} onChange={(e) => { setFilterVenue(e.target.value); setPage(1); }} placeholder="e.g. O2 Arena" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)]" />
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Location</label>
                            <button onClick={() => { setFilterLocation(''); setPage(1); }} className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <input type="text" value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }} placeholder="e.g. London" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)]" />
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <button onClick={() => { setFilterKeyword(''); setFilterVenue(''); setFilterLocation(''); setPage(1); }} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-sm transition-all active:scale-95">
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
                  viewType === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10" :
                  viewType === 'medium' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" :
                  "space-y-4"
                }>
                  {isLoading ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <div key={i} className={`animate-pulse bg-white/5 p-4 rounded-lg border border-white/5 ${viewType === 'list' ? 'flex items-center gap-4' : ''}`}>
                         <div className={`bg-white/10 rounded-lg ${viewType === 'grid' ? 'aspect-square w-full mb-4' : 'w-16 h-16 shrink-0'}`} />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                         </div>
                      </div>
                    ))
                  ) : events.length > 0 ? (
                    events.map((event) => (
                      viewType === 'grid' ? (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="group flex flex-col h-full cursor-pointer relative text-left">
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative shrink-0 bg-[#1A1A1A] border border-white/5 shadow-2xl">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80`;
                              }}
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleLike(event.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all z-20">
                                <Heart size={16} className={likedIds.includes(event.id) ? "text-red-500 fill-red-500" : "text-white"} />
                              </button>
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); navigateToEdit(event.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all z-20">
                                <Edit2 size={16} className="text-white" />
                              </button>
                            </div>
                            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                               {event.spotify_date ? new Date(event.spotify_date).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                          <h4 className="font-heading text-base font-bold text-white tracking-tight truncate px-1">{event.title}</h4>
                          <p className="text-[11px] font-semibold text-[var(--color-brand-muted)] px-1 truncate mt-0.5 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <MapPin size={10} /> {event.spotify_venue_name || 'Venue Unknown'}
                          </p>
                        </div>
                      ) : viewType === 'medium' ? (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-[var(--color-brand-surface-1)] border border-white/5 p-5 rounded-lg group hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer flex gap-5 relative">
                           <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/5">
                              <img 
                                src={event.image} 
                                alt={event.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80`;
                                }}
                              />
                           </div>
                           <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="font-bold text-white text-lg truncate mb-1">{event.title}</h4>
                              <div className="flex flex-col gap-1 text-[12px] text-[var(--color-brand-muted)] mb-3">
                                 <span className="flex items-center gap-2"><CalendarDays size={12} className="text-[var(--color-brand-violet)]" /> {event.spotify_date ? new Date(event.spotify_date).toLocaleDateString() : 'TBD'}</span>
                                 <span className="flex items-center gap-2"><MapPin size={12} className="text-[var(--color-brand-violet)]" /> {event.spotify_venue_name}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-[var(--color-brand-muted)] uppercase tracking-widest">{event.status || 'Active'}</div>
                                 <div className="flex items-center gap-2">
                                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(event.id, e)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-20"><Edit2 size={14} /></button>
                                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => toggleLike(event.id, e)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                      <Heart size={14} className={likedIds.includes(event.id) ? "fill-red-500 text-red-500" : "text-white/80"} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className="flex items-center bg-[var(--color-brand-surface-1)] border border-white/5 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
                           <div className="flex-1 flex items-center gap-5 min-w-0 pr-6">
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=100&q=80`; }} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-bold text-white truncate">{event.title}</h4>
                                <span className="text-[12px] font-semibold text-[var(--color-brand-muted)] truncate uppercase tracking-wider">{event.spotify_venue_name}</span>
                              </div>
                           </div>
                           <div className="w-48 shrink-0 text-sm text-[var(--color-brand-muted)] px-4 hidden lg:flex items-center gap-2 font-medium">
                              <Calendar size={14} className="text-[var(--color-brand-violet)]" /> {event.spotify_date ? new Date(event.spotify_date).toLocaleDateString() : 'TBD'}
                           </div>
                           <div className="w-32 shrink-0 flex items-center justify-center px-4">
                              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                                 {event.status || 'Verified'}
                              </div>
                           </div>
                           <div className="flex items-center justify-end gap-2 shrink-0 pl-1">
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(event.id, e)} className="p-2.5 rounded-lg text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10 transition-all border border-white/5 bg-white/5 z-20">
                                <Edit2 size={16} />
                              </button>
                              <div className="h-6 w-px bg-white/10 mx-2" />
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className="px-5 py-2.5 rounded-lg bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] text-[11px] font-black uppercase tracking-wider hover:bg-[var(--color-brand-violet)] hover:text-white transition-all z-20">Details</button>
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-lg bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <Calendar size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No events found</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Try adjusting your filters or search terms.</p>
                       <button onClick={() => { setShowLikedOnly(false); setPage(1) }} className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">Clear Filters</button>
                    </div>
                  )}
                </div>

                {events.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={events.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
         
         <EventDrawer 
           isOpen={!!selectedEvent} 
           onClose={() => setSelectedEvent(null)} 
           data={selectedEvent} 
         />
      </div>
    </div>
  )
}

// Reuse some lucide icons if they were missing in imports
const SlidersHorizontal = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/></svg>
