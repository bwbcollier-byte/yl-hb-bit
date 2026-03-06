"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Building2, Plus, Filter, Search, MapPin, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, CheckCircle2, Users2, SlidersHorizontal, Layers, TableProperties,
  Info, Edit2, Trash2, XCircle
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { VenueDrawer } from "@/components/directory-drawers"
import { motion, AnimatePresence } from "framer-motion"
import { FluidDropdown, DropdownOption } from "@/components/ui/fluid-dropdown"
import { EditorTable, EditorRowData, ActionsDropdown } from "@/components/ui/animated-project-cards"

interface VenueProfile {
  id: string
  name: string
  details: string
  spd_stadium_id: string
  location: string
  home_club: string
  status: string
  primary_use: string
  image: string
  capacity: number
  city: string
  soc_website: string
  construction: string
}

export default function VenuesDirectory() {
  const router = useRouter()
  const [venues, setVenues] = useState<VenueProfile[]>([])
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
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedVenue, setSelectedVenue] = useState<VenueProfile | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [avgCapacity, setAvgCapacity] = useState(0)
  const [topCity, setTopCity] = useState('')
  const [editorMode, setEditorMode] = useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = useState<Set<string>>(new Set())

  const statusOptions: DropdownOption[] = [
    { id: "", label: "All Status", icon: Layers, color: "#A06CD5" },
    { id: "Active", label: "Active", icon: CheckCircle2, color: "#4ECDC4" },
    { id: "Inactive", label: "Inactive", icon: X, color: "#EB5757" },
    { id: "In Construction", label: "Construction", icon: Info, color: "#F9C74F" }
  ]
  
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
    router.push(`/dashboard/venues/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        let countQuery = supabase
          .from("venue_profiles")
          .select("id", { count: "exact", head: true })
        
        if (filterStatus) countQuery = countQuery.eq('status', filterStatus)
        if (filterKeyword) countQuery = countQuery.ilike('name', `%${filterKeyword}%`)
        countQuery = countQuery.not('image', 'is', null)
        
        const { count } = await countQuery
        if (count !== null) setTotalCount(count)

        // Fetch average capacity
        let avgCapacityQuery = supabase
          .from("venue_profiles")
          .select("capacity")
          .not('image', 'is', null)
        if (filterStatus) avgCapacityQuery = avgCapacityQuery.eq('status', filterStatus)
        if (filterKeyword) avgCapacityQuery = avgCapacityQuery.ilike('name', `%${filterKeyword}%`)

        const { data: avgCapacityData, error: avgCapacityError } = await avgCapacityQuery
        if (avgCapacityData && avgCapacityData.length > 0) {
          const totalCapacity = avgCapacityData.reduce((sum, venue) => sum + (venue.capacity || 0), 0)
          setAvgCapacity(Math.round(totalCapacity / avgCapacityData.length))
        } else {
          setAvgCapacity(0)
        }

        // Fetch top location
        let locationQuery = supabase
          .from("venue_profiles")
          .select("location")
          .not('image', 'is', null)
        if (filterStatus) locationQuery = locationQuery.eq('status', filterStatus)
        if (filterKeyword) locationQuery = locationQuery.ilike('name', `%${filterKeyword}%`)
        
        const { data: locData } = await locationQuery
        if (locData && locData.length > 0) {
          const locCounts = locData.reduce((acc, curr) => {
            if (curr.location) acc[curr.location] = (acc[curr.location] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          const sortedLocs = Object.entries(locCounts).sort(([, countA], [, countB]) => countB - countA)
          setTopCity(sortedLocs.length > 0 ? sortedLocs[0][0] : '')
        } else {
          setTopCity('')
        }

        let query = supabase
          .from("venue_profiles")
          .select("*")
        
        if (filterStatus) query = query.eq('status', filterStatus)
        if (filterKeyword) query = query.ilike('name', `%${filterKeyword}%`)
        query = query.not('image', 'is', null)
        
        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setVenues([])
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
          setVenues(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setVenues([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, filterStatus, filterKeyword])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Venues</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Directory of stadiums, arenas, and performance spaces.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Venues', value: totalCount.toString(), icon: Building2, growth: '+2%' },
                      { label: 'Avg Capacity', value: new Intl.NumberFormat().format(avgCapacity), icon: Users2, growth: 'Stable' },
                      { label: 'Top Location', value: topCity || 'N/A', icon: MapPin, growth: 'Live' },
                      { label: 'Featured', value: totalCount > 0 ? Math.ceil(totalCount * 0.1).toString() : '0', icon: CheckCircle2, growth: '+1' }
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
                        placeholder="Search venues..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all shadow-lg"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative" ref={filterRef}>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSortAsc(!sortAsc); setPage(1) }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                        >
                          {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </button>
                        <div className="relative" ref={sortRef}>
                          <button 
                            onClick={() => setSortOpen(!sortOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-semibold transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                          >
                            <span className="hidden sm:inline">Sort By</span>
                            <ChevronDown size={14} className="ml-1 opacity-60" />
                          </button>
                          {sortOpen && (
                            <div className="absolute top-12 left-0 w-44 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden text-sm font-semibold animate-in fade-in zoom-in-95 duration-200">
                              {[
                                { label: "Venue Name", val: "name" },
                                { label: "Capacity", val: "capacity" },
                                { label: "City", val: "city" }
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

                      <button onClick={() => setEditorMode(!editorMode)} className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${editorMode ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`} title={editorMode ? "Exit Editor" : "Editor View"}>
                        <TableProperties size={18} />
                      </button>

                      {editorMode ? (
                        selectedEditorIds.size > 0 && (
                          <ActionsDropdown
                            label={`${selectedEditorIds.size} Selected`}
                            targetIds={Array.from(selectedEditorIds)}
                            actions={[
                              { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('venue_profiles').update({ status: 'active' }).eq('id', id)));
                                setVenues(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'active' } : v));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('venue_profiles').update({ status: 'inactive' }).eq('id', id)));
                                setVenues(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'inactive' } : v));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'delete', label: 'Delete Selected', icon: <Trash2 size={14} />, variant: 'danger', onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('venue_profiles').delete().eq('id', id)));
                                setVenues(prev => prev.filter(v => !ids.includes(v.id)));
                                setSelectedEditorIds(new Set());
                              }},
                            ]}
                          />
                        )
                      ) : (
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
                      )}

                      <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      
                      <Link href="/dashboard/venues/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add Venue
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                {filterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 font-heading font-bold text-[var(--color-brand-text)] text-base">
                          <Filter size={18} className="text-[var(--color-brand-violet)]" /> Filters & Categorization
                        </div>
                        <button onClick={() => setFilterOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-white transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">Quick Search</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input type="text" value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }} placeholder="Venue name..." className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)] shadow-inner" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">Status</label>
                          <FluidDropdown 
                            options={statusOptions}
                            value={filterStatus}
                            onChange={(val) => { setFilterStatus(val); setPage(1); }}
                          />
                        </div>
                      </div>
                      <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <button onClick={() => { setFilterStatus(''); setFilterKeyword(''); setPage(1); }} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-xs transition-all active:scale-95 uppercase tracking-widest">
                          Reset All
                        </button>
                        <button onClick={() => setFilterOpen(false)} className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)] text-xs uppercase tracking-widest">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {editorMode ? (
                  <EditorTable
                    columns={[
                      { key: 'image', label: 'Image', width: '60px', render: (val: any, row: EditorRowData) => (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden border border-white/10">
                          <img src={row.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.title)}&size=100`} alt="" className="w-full h-full object-cover" />
                        </div>
                      )},
                      { key: 'title', label: 'Venue Name', render: (val: any) => <span className="font-bold text-white text-[13px]">{val}</span> },
                      { key: 'location', label: 'Location' },
                      { key: 'capacity', label: 'Capacity', width: '100px', render: (val: any) => <span className="text-white/70 text-[13px]">{val ? new Intl.NumberFormat().format(val) : '\u2014'}</span> },
                      { key: 'status', label: 'Status', width: '120px', render: (val: any, row: EditorRowData) => (
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold cursor-pointer hover:border-white/20 transition-all active:scale-95 select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = val === 'inactive' ? 'active' : 'inactive';
                            supabase.from('venue_profiles').update({ status: newStatus }).eq('id', row.id).then(() => {
                              setVenues(prev => prev.map(v => v.id === row.id ? { ...v, status: newStatus } : v));
                            });
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${val === 'inactive' ? 'bg-red-500 text-red-500' : 'bg-[#00FA9A] text-[#00FA9A]'}`} />
                          {val === 'inactive' ? 'Inactive' : 'Active'}
                        </div>
                      )},
                    ]}
                    data={venues.map(v => ({
                      id: v.id,
                      title: v.name,
                      image: v.image,
                      location: v.location,
                      capacity: v.capacity,
                      status: v.status || 'active',
                      description: v.details,
                      tags: v.primary_use ? [v.primary_use] : [],
                      meta: [
                        ...(v.home_club ? [{ label: 'Home Club', value: v.home_club }] : []),
                        ...(v.construction ? [{ label: 'Built', value: v.construction }] : []),
                        ...(v.capacity ? [{ label: 'Capacity', value: new Intl.NumberFormat().format(v.capacity) }] : []),
                      ],
                    }))}
                    onEdit={(id) => router.push(`/dashboard/venues/${id}/edit`)}
                    onDelete={async (id) => {
                      await supabase.from('venue_profiles').delete().eq('id', id);
                      setVenues(prev => prev.filter(v => v.id !== id));
                    }}
                    onRowClick={(row) => {
                      const venue = venues.find(v => v.id === row.id);
                      if (venue) setSelectedVenue(venue);
                    }}
                    selectedIds={selectedEditorIds}
                    onSelectionChange={setSelectedEditorIds}
                    actions={[
                      { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('venue_profiles').update({ status: 'active' }).eq('id', id)));
                        setVenues(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'active' } : v));
                      }},
                      { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('venue_profiles').update({ status: 'inactive' }).eq('id', id)));
                        setVenues(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'inactive' } : v));
                      }},
                    ]}
                    isLoading={isLoading}
                  />
                ) : (
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
                  ) : venues.length > 0 ? (
                    venues.map((venue) => (
                      viewType === 'grid' ? (
                        <div key={venue.id} onClick={() => setSelectedVenue(venue)} className="group flex flex-col h-full cursor-pointer relative text-left">
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative shrink-0 bg-[#1A1A1A] border border-white/5 shadow-2xl flex items-center justify-center group-hover:border-[var(--color-brand-violet)]/40 transition-all">
                            <img 
                              src={venue.image} 
                              alt={venue.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://picsum.photos/seed/${venue.name?.replace(/\s+/g, '')}venue/400/400`;
                              }}
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleLike(venue.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 z-20 shadow-xl transition-all">
                                <Heart size={16} className={likedIds.includes(venue.id) ? "text-red-500 fill-red-500" : "text-white"} />
                              </button>
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); navigateToEdit(venue.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 z-20 shadow-xl transition-all">
                                <Edit2 size={16} className="text-white" />
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                              {new Intl.NumberFormat().format(venue.capacity)}
                            </div>
                          </div>
                          <h4 className="font-heading text-base font-bold text-white tracking-tight truncate px-1 transition-colors group-hover:text-[var(--color-brand-violet)]">{venue.name}</h4>
                          <p className="text-[11px] font-black text-[var(--color-brand-muted)] px-1 truncate mt-0.5 mb-2 uppercase tracking-widest flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <MapPin size={10} className="text-[var(--color-brand-violet)]" /> {venue.location || 'Location Unknown'}
                          </p>
                        </div>
                      ) : (
                        <div key={venue.id} onClick={() => setSelectedVenue(venue)} className="bg-[var(--color-brand-surface-1)] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer group shadow-2xl hover:bg-white/5">
                           <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                              <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(venue.name)}&size=100`; }} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate group-hover:text-[var(--color-brand-violet)] transition-colors">{venue.name}</h4>
                              <div className="flex items-center gap-3 text-[10px] text-[var(--color-brand-muted)] font-black mt-1 uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><Building2 size={10} className="text-[var(--color-brand-violet)]" /> {venue.primary_use}</span>
                                 <span className="flex items-center gap-1.5 border-l border-white/10 pl-3"><MapPin size={10} className="text-[var(--color-brand-violet)]" /> {venue.location || 'Unknown'}</span>
                                 <span className="flex items-center gap-1.5 border-l border-white/10 pl-3"><Users2 size={10} className="text-[var(--color-brand-violet)]" /> {new Intl.NumberFormat().format(venue.capacity)}</span>
                              </div>
                           </div>
                           <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(venue.id, e)} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:border-white/10 z-20 shadow-sm transition-all">
                             <Edit2 size={16} />
                           </button>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center text-white/40 font-bold uppercase tracking-widest text-sm">
                       No venues found matching your criteria.
                    </div>
                  )}
                </div>
                )}

                <PaginationBar 
                  page={page} 
                  setPage={setPage} 
                  hasMore={hasMore} 
                  totalCount={totalCount} 
                  currentLength={venues.length} 
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                  noun="venues"
                />
            </div>
         </div>
         <VenueDrawer 
           isOpen={!!selectedVenue} 
           onClose={() => setSelectedVenue(null)} 
           data={selectedVenue} 
         />
      </div>
    </div>
  )
}
