"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Globe2, Plus, Filter, Search, MapPin, 
  ChevronDown, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, Edit2, CheckCircle2, Globe, Flag,
  MoreVertical, ChevronUp
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface CountryProfile {
  id: string
  name: string
  country_code: string
  about: string
  region: string
  flag_square: string
  flag_emoji: string
}

export default function CountriesDirectory() {
  const router = useRouter()
  const [countries, setCountries] = useState<CountryProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [totalCount, setTotalCount] = useState(0)
  
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const navigateToEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/countries/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        const { count } = await supabase
          .from("countries")
          .select("id", { count: "exact", head: true })
        if (count !== null) setTotalCount(count)

        let query = supabase
          .from("countries")
          .select("*")
        
        const { data, error } = await query
          .order(sortField, { ascending: sortAsc })
          .range(from, to)
        
        if (data && data.length > 0) {
          setCountries(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setCountries([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, itemsPerPage])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Countries & Regions</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Dictionary list and configuration for supported regions worldwide.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Supported', value: totalCount.toString(), icon: Globe, growth: '+2%' },
                      { label: 'Active Regions', value: '6', icon: MapPin, growth: '0%' },
                      { label: 'Platform Languages', value: '4', icon: CheckCircle2, growth: '+1%' },
                      { label: 'Global Traffic', value: '74%', icon: Globe2, growth: '+15%' }
                    ].map((card, i) => (
                      <div key={i} className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-lg hover:border-[var(--color-brand-violet)]/20 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-surface-2)] flex items-center justify-center text-[var(--color-brand-violet)] group-hover:scale-110 transition-transform">
                            <card.icon size={24} />
                          </div>
                          <button className="text-[var(--color-brand-muted)] hover:text-white transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-auto mb-2">
                           <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                           <span className="text-[11px] font-bold text-[var(--color-brand-neon)] bg-[var(--color-brand-neon)]/10 px-2 py-1 rounded flex items-center gap-1 leading-none shadow-sm shadow-[var(--color-brand-neon)]/5">
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
                        placeholder="Search countries..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative" ref={filterRef}>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSortAsc(!sortAsc); setPage(1) }}
                          className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                        >
                          {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </button>
                        <div className="relative" ref={sortRef}>
                          <button 
                            onClick={() => setSortOpen(!sortOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-xl border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-semibold transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                          >
                            <span className="hidden sm:inline">Sort By</span>
                            <ChevronDown size={14} className="ml-1 opacity-60" />
                          </button>
                          {sortOpen && (
                            <div className="absolute top-12 left-0 w-44 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden text-sm font-semibold animate-in fade-in zoom-in-95 duration-200">
                              {[
                                { label: "Country Name", val: "name" },
                                { label: "ISO Code", val: "country_code" },
                                { label: "Region", val: "region" }
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

                      <div className="flex items-center p-1 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl">
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
                        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      
                      <Link href="/dashboard/countries/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add Country
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className={
                  viewType === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10" :
                  viewType === 'medium' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" :
                  "space-y-4"
                }>
                  {isLoading ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <div key={i} className={`animate-pulse bg-white/5 p-4 rounded-xl border border-white/5 ${viewType === 'list' ? 'flex items-center gap-4' : ''}`}>
                         <div className={`bg-white/10 rounded-lg ${viewType === 'grid' ? 'aspect-video w-full mb-4' : 'w-16 h-12 shrink-0'}`} />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                         </div>
                      </div>
                    ))
                  ) : countries.length > 0 ? (
                    countries.map((country) => (
                      viewType === 'grid' ? (
                        <div key={country.id} className="group flex flex-col h-full cursor-pointer relative text-left bg-[var(--color-brand-surface-1)] p-4 rounded-2xl border border-white/5 shadow-lg hover:border-[var(--color-brand-violet)]/40 transition-all">
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 relative shrink-0 bg-[#000] border border-white/10 shadow-inner flex items-center justify-center">
                            {country.flag_square ? (
                               <img 
                                 src={country.flag_square} 
                                 alt={country.name} 
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                               />
                            ) : (
                               <span className="text-6xl">{country.flag_emoji || '🏳️'}</span>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button onClick={(e) => navigateToEdit(country.id, e)} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                                <Edit2 size={14} className="text-white" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 px-1 mb-1">
                             <h4 className="font-heading text-base font-bold text-white tracking-tight truncate">{country.name}</h4>
                             <span className="text-xs font-mono font-bold text-[var(--color-brand-violet)] uppercase px-1.5 py-0.5 rounded bg-[var(--color-brand-violet)]/10">{country.country_code || 'N/A'}</span>
                          </div>
                          
                          <p className="text-[11px] font-semibold text-[var(--color-brand-muted)] px-1 truncate uppercase tracking-wider flex items-center gap-1">
                            <Globe size={10} /> {country.region || 'Unknown Region'}
                          </p>
                        </div>
                      ) : (
                        // Simplified row/card for other views
                        <div key={country.id} className="bg-[var(--color-brand-surface-1)] border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer group shadow-lg">
                           <div className="w-16 h-12 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                              {country.flag_square ? (
                                <img src={country.flag_square} alt={country.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{country.flag_emoji || '🏳️'}</span>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate flex items-center gap-2">
                                  {country.name} 
                                  <span className="text-[10px] font-mono font-bold text-[var(--color-brand-violet)] uppercase px-1.5 py-0.5 rounded bg-[var(--color-brand-violet)]/10">{country.country_code}</span>
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] text-[var(--color-brand-muted)] font-medium mt-1 uppercase tracking-wider">
                                 <span className="flex items-center gap-1"><Globe size={10} className="text-[var(--color-brand-violet)]" /> {country.region}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button onClick={(e) => navigateToEdit(country.id, e)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                                <Edit2 size={16} />
                              </button>
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-3xl bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <Globe size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No countries listed</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Add entries to your region dictionary.</p>
                       <Link href="/dashboard/countries/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">Add First Country</button>
                       </Link>
                    </div>
                  )}
                </div>

                {countries.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={countries.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="countries"
                  />
                )}
            </div>
         </div>
      </div>
    </div>
  )
}
