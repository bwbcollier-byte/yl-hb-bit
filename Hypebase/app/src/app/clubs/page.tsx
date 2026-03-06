"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  UsersRound, Plus, Filter, Search, MapPin, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, Trophy, Users,
  MoreVertical, ChevronUp, Globe, Layers, TableProperties,
  Trash2, XCircle
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ClubDrawer } from "@/components/directory-drawers"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { FluidDropdown, DropdownOption } from "@/components/ui/fluid-dropdown"
import { EditorTable, EditorRowData, ActionsDropdown } from "@/components/ui/animated-project-cards"

interface ClubProfile {
  id: string
  name: string
  type: string
  location: string
  logo: string
  logo_url: string
  sdb_badge: string
  sdb_logo: string
  sdb_banner: string
  sdb_country: string
  sdb_sport: string
  league_name: string
  description: string
  website: string
  status: string
}

export default function ClubsDirectory() {
  const router = useRouter()
  const [clubs, setClubs] = useState<ClubProfile[]>([])
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
  const [editorMode, setEditorMode] = useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = useState<Set<string>>(new Set())
  
  const [selectedClub, setSelectedClub] = useState<ClubProfile | null>(null)
  const [filterSport, setFilterSport] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterLeague, setFilterLeague] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')

  const sportOptions: DropdownOption[] = [
    { id: "", label: "All Sports", icon: Layers, color: "#A06CD5" },
    { id: "Soccer", label: "Soccer", icon: Trophy, color: "#4ECDC4" },
    { id: "Basketball", label: "Basketball", icon: Trophy, color: "#F9C74F" },
    { id: "Ice Hockey", label: "Ice Hockey", icon: Trophy, color: "#90BE6D" },
    { id: "American Football", label: "American Football", icon: Trophy, color: "#F9844A" },
    { id: "Baseball", label: "Baseball", icon: Trophy, color: "#F8961E" },
    { id: "Rugby", label: "Rugby", icon: Trophy, color: "#2D9CDB" },
    { id: "Cricket", label: "Cricket", icon: Trophy, color: "#BB6BD9" },
    { id: "Motorsport", label: "Motorsport", icon: Trophy, color: "#EB5757" }
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
    router.push(`/dashboard/clubs/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        const countQuery = supabase
          .from("clubs_teams_groups")
          .select("id", { count: "exact", head: true })
        
        if (filterSport) countQuery.eq('sdb_sport', filterSport)
        if (filterCountry) countQuery.eq('sdb_country', filterCountry)
        if (filterLeague) countQuery.ilike('league_name', `%${filterLeague}%`)
        if (filterKeyword) countQuery.ilike('name', `%${filterKeyword}%`)
        const { count } = await countQuery
        if (count !== null) setTotalCount(count)

        let query = supabase
          .from("clubs_teams_groups")
          .select("*")
        
        if (filterSport) query = query.eq('sdb_sport', filterSport)
        if (filterCountry) query = query.eq('sdb_country', filterCountry)
        if (filterLeague) query = query.ilike('league_name', `%${filterLeague}%`)
        if (filterKeyword) query = query.ilike('name', `%${filterKeyword}%`)
        
        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setClubs([])
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
          setClubs(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setClubs([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, filterSport, filterCountry, filterLeague, filterKeyword])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Clubs & Teams</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Directory of sports clubs, professional teams, and community groups.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Clubs', value: '840', icon: UsersRound, growth: '+5%' },
                      { label: 'Active Teams', value: '2,100', icon: Trophy, growth: '+12%' },
                      { label: 'Total Members', value: '1.2M', icon: Users, growth: '+20%' },
                      { label: 'Sponsorships', value: '$4.2M', icon: CheckCircle2, growth: '+10%' }
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
                        placeholder="Search clubs, teams..." 
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
                                { label: "Club Name", val: "name" },
                                { label: "Type", val: "type" },
                                { label: "Location", val: "location" }
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
                                await Promise.all(ids.map(id => supabase.from('clubs_teams_groups').update({ status: 'active' }).eq('id', id)));
                                setClubs(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'active' } : c));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('clubs_teams_groups').update({ status: 'inactive' }).eq('id', id)));
                                setClubs(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'inactive' } : c));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'delete', label: 'Delete Selected', icon: <Trash2 size={14} />, variant: 'danger', onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('clubs_teams_groups').delete().eq('id', id)));
                                setClubs(prev => prev.filter(c => !ids.includes(c.id)));
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
                      
                      <Link href="/dashboard/clubs/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add Club
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Filter Panel - pushes content down */}
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
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">Quick Search</label>
                            <button onClick={() => { setFilterKeyword(''); setPage(1); }} className="text-[10px] font-black text-[var(--color-brand-violet)] hover:underline uppercase tracking-widest">Clear</button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input type="text" value={filterKeyword} onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }} placeholder="Club name or type..." className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)] shadow-inner" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">Sport Category</label>
                            <button onClick={() => { setFilterSport(''); setPage(1); }} className="text-[10px] font-black text-[var(--color-brand-violet)] hover:underline uppercase tracking-widest">Clear</button>
                          </div>
                          <FluidDropdown 
                            options={sportOptions}
                            value={filterSport}
                            onChange={(val) => { setFilterSport(val); setPage(1); }}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">Country</label>
                            <button onClick={() => { setFilterCountry(''); setPage(1); }} className="text-[10px] font-black text-[var(--color-brand-violet)] hover:underline uppercase tracking-widest">Clear</button>
                          </div>
                          <input type="text" value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }} placeholder="e.g. England" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)] shadow-inner" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[var(--color-brand-muted)] tracking-widest uppercase">League / Division</label>
                            <button onClick={() => { setFilterLeague(''); setPage(1); }} className="text-[10px] font-black text-[var(--color-brand-violet)] hover:underline uppercase tracking-widest">Clear</button>
                          </div>
                          <input type="text" value={filterLeague} onChange={(e) => { setFilterLeague(e.target.value); setPage(1); }} placeholder="e.g. Premier League" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)] shadow-inner" />
                        </div>
                      </div>
                      <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <button onClick={() => { setFilterSport(''); setFilterCountry(''); setFilterLeague(''); setFilterKeyword(''); setPage(1); }} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-xs transition-all active:scale-95 uppercase tracking-widest">
                          Reset All Filters
                        </button>
                        <button onClick={() => setFilterOpen(false)} className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)] text-xs uppercase tracking-widest">
                          Hide Panel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {editorMode ? (
                  <EditorTable
                    columns={[
                      { key: 'image', label: 'Logo', width: '60px', render: (val: any, row: EditorRowData) => (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden border border-white/10">
                          <img src={row.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.title)}&size=100`} alt="" className="w-full h-full object-cover" />
                        </div>
                      )},
                      { key: 'title', label: 'Club Name', render: (val: any) => <span className="font-bold text-white text-[13px]">{val}</span> },
                      { key: 'sport', label: 'Sport', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '\u2014'}</span> },
                      { key: 'country', label: 'Country', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '\u2014'}</span> },
                      { key: 'league', label: 'League', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '\u2014'}</span> },
                    ]}
                    data={clubs.map(c => ({
                      id: c.id,
                      title: c.name,
                      image: c.logo || c.logo_url || c.sdb_badge || c.sdb_logo,
                      sport: c.sdb_sport,
                      country: c.sdb_country,
                      league: c.league_name,
                      description: c.description,
                      location: c.sdb_country,
                      tags: [c.sdb_sport, c.league_name].filter(Boolean),
                      meta: [
                        ...(c.website ? [{ label: 'Website', value: c.website }] : []),
                      ],
                    }))}
                    onEdit={(id) => router.push(`/dashboard/clubs/${id}/edit`)}
                    onDelete={async (id) => {
                      await supabase.from('clubs_teams_groups').delete().eq('id', id);
                      setClubs(prev => prev.filter(c => c.id !== id));
                    }}
                    onRowClick={(row) => {
                      const club = clubs.find(c => c.id === row.id);
                      if (club) setSelectedClub(club);
                    }}
                    selectedIds={selectedEditorIds}
                    onSelectionChange={setSelectedEditorIds}
                    actions={[
                      { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('clubs_teams_groups').update({ status: 'active' }).eq('id', id)));
                        setClubs(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'active' } : c));
                      }},
                      { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('clubs_teams_groups').update({ status: 'inactive' }).eq('id', id)));
                        setClubs(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'inactive' } : c));
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
                  ) : clubs.length > 0 ? (
                    clubs.map((club) => (
                      viewType === 'grid' ? (
                        <div key={club.id} onClick={() => setSelectedClub(club)} className="group flex flex-col h-full cursor-pointer relative text-left">
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative shrink-0 bg-[#1A1A1A] border border-white/5 shadow-2xl flex items-center justify-center group-hover:border-[var(--color-brand-violet)]/40 transition-all">
                            <img 
                              src={club.logo_url || club.sdb_badge || club.logo} 
                              alt={club.name} 
                              className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=random&size=400`;
                              }}
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleLike(club.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 z-20 shadow-xl transition-all">
                                <Heart size={16} className={likedIds.includes(club.id) ? "text-red-500 fill-red-500" : "text-white"} />
                              </button>
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); navigateToEdit(club.id, e); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 z-20 shadow-xl transition-all">
                                <Edit2 size={16} className="text-white" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-heading text-base font-bold text-white tracking-tight truncate px-1 transition-colors group-hover:text-[var(--color-brand-violet)]">{club.name}</h4>
                          <p className="text-[11px] font-black text-[var(--color-brand-muted)] px-1 truncate mt-0.5 mb-2 uppercase tracking-widest flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <MapPin size={10} className="text-[var(--color-brand-violet)]" /> {club.location || 'Location Unknown'}
                          </p>
                        </div>
                      ) : (
                        // Simplified row/card for other views
                        <div key={club.id} onClick={() => setSelectedClub(club)} className="bg-[var(--color-brand-surface-1)] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer group shadow-2xl hover:bg-white/5">
                           <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-sm">
                              <img src={club.logo_url || club.sdb_badge || club.logo} alt={club.name} className="max-w-full max-h-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&size=100`; }} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate group-hover:text-[var(--color-brand-violet)] transition-colors">{club.name}</h4>
                              <div className="flex items-center gap-3 text-[10px] text-[var(--color-brand-muted)] font-black mt-1 uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><Trophy size={10} className="text-[var(--color-brand-violet)]" /> {club.type}</span>
                                 <span className="flex items-center gap-1.5 border-l border-white/10 pl-3"><MapPin size={10} className="text-[var(--color-brand-violet)]" /> {club.location}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(club.id, e)} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:border-white/10 z-20 shadow-sm transition-all">
                                <Edit2 size={16} />
                              </button>
                              {club.website && <a href={club.website} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:border-white/10 z-20 shadow-sm transition-all"><Globe size={16} /></a>}
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-lg bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <UsersRound size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No clubs found</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Be the first to create directory entries for clubs and teams.</p>
                       <Link href="/dashboard/clubs/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">Add New Club</button>
                       </Link>
                    </div>
                  )}
                </div>
                )}

                {clubs.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={clubs.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
         <ClubDrawer 
           isOpen={!!selectedClub} 
           onClose={() => setSelectedClub(null)} 
           data={selectedClub} 
         />
      </div>
    </div>
  )
}
