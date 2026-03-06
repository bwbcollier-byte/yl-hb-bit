"use client"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Contact, Plus, Filter, Search, MapPin, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, Mail, Phone,
  MoreVertical, ChevronUp, Briefcase, Linkedin, Instagram, Twitter, Layers, TableProperties,
  Trash2, XCircle
} from "lucide-react"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { supabase } from "@/lib/supabase"
import { useState, useRef, useEffect } from "react"
import { ContactDrawer } from "@/components/directory-drawers"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { FluidDropdown, DropdownOption } from "@/components/ui/fluid-dropdown"
import { EditorTable, EditorRowData, ActionsDropdown } from "@/components/ui/animated-project-cards"

interface ContactProfile {
  id: string
  name_full: string
  email: string
  phone: string
  role: string
  company_id: string
  status: string
  image_url: string
  location: string
  about: string
  social_instagram: string
  social_linkedin: string
  social_twitter: string
}

export default function ContactsDirectory() {
  const router = useRouter()
  const [contacts, setContacts] = useState<ContactProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("name_full")
  const [sortAsc, setSortAsc] = useState(true)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [editorMode, setEditorMode] = useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = useState<Set<string>>(new Set())

  const statusOptions: DropdownOption[] = [
    { id: "", label: "All Statuses", icon: Layers, color: "#A06CD5" },
    { id: "active", label: "Active", icon: CheckCircle2, color: "#4ECDC4" },
    { id: "inactive", label: "Inactive", icon: X, color: "#FF6B6B" }
  ]
  
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null)
  
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLikedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const navigateToEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/contacts/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      try {
        const { count } = await supabase
          .from("crm_contacts")
          .select("id", { count: "exact", head: true })
        if (count !== null) setTotalCount(count)

        let query = supabase
          .from("crm_contacts")
          .select("*")
        
        if (debouncedSearch) {
          query = query.or(`name_full.ilike.%${debouncedSearch}%,role.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
        }

        if (showLikedOnly) {
          if (likedIds.length === 0) {
            setContacts([])
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
          setContacts(data)
          setHasMore(data.length === itemsPerPage)
        } else {
          setContacts([])
          setHasMore(false)
        }
      } catch (err) {
        console.error(err)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, likedIds, debouncedSearch])

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Contacts CRM</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Centralized database of industry contacts, agents, and brand representatives.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Total Contacts', value: '4,820', icon: Contact, growth: '+15%' },
                      { label: 'Active Leads', value: '312', icon: CheckCircle2, growth: '+22%' },
                      { label: 'Connected Orgs', value: '840', icon: Briefcase, growth: '+5%' },
                      { label: 'Avg Feedback', value: '4.8', icon: CheckCircle2, growth: '+2%' }
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
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="Search contacts, roles, emails..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all shadow-lg"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)] hover:text-white">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 relative" ref={filterRef}>
                      <div className="flex items-center gap-2">
                         {/* Sort Asc/Desc */}
                         <button onClick={() => setSortAsc(!sortAsc)} className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white">
                            {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                         </button>
                        <div className="relative" ref={sortRef}>
                          <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-white/10 bg-[var(--color-brand-surface-1)] text-sm font-semibold text-[var(--color-brand-muted)] hover:text-white">
                            <span>Sort By</span>
                            <ChevronDown size={14} className="opacity-60" />
                          </button>
                          {sortOpen && (
                            <div className="absolute top-12 left-0 w-44 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden text-sm font-semibold">
                              {[
                                { label: "Full Name", val: "name_full" },
                                { label: "Job Role", val: "role" },
                                { label: "Location", val: "location" }
                              ].map(opt => (
                                <button key={opt.val} onClick={() => { setSortField(opt.val); setSortOpen(false); setPage(1) }} className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${sortField === opt.val ? "text-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/10" : "text-[var(--color-brand-muted)] hover:text-white"}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={() => setShowLikedOnly(!showLikedOnly)} className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${showLikedOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-white/10 bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white'}`}>
                        <Heart size={18} className={showLikedOnly ? "fill-red-500" : ""} />
                      </button>

                      <button onClick={() => setEditorMode(!editorMode)} className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${editorMode ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white'}`} title={editorMode ? "Exit Editor" : "Editor View"}>
                        <TableProperties size={18} />
                      </button>

                      {editorMode ? (
                        selectedEditorIds.size > 0 && (
                          <ActionsDropdown
                            label={`${selectedEditorIds.size} Selected`}
                            targetIds={Array.from(selectedEditorIds)}
                            actions={[
                              { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('contact_profiles').update({ status: 'active' }).eq('id', id)));
                                setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'active' } : c));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('contact_profiles').update({ status: 'inactive' }).eq('id', id)));
                                setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'inactive' } : c));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'delete', label: 'Delete Selected', icon: <Trash2 size={14} />, variant: 'danger', onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('contact_profiles').delete().eq('id', id)));
                                setContacts(prev => prev.filter(c => !ids.includes(c.id)));
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
                          <button key={type.id} onClick={() => setViewType(type.id as any)} className={`p-1.5 rounded-lg transition-all ${viewType === type.id ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-white'}`}>
                             <type.icon size={16} />
                          </button>
                        ))}
                      </div>
                      )}
                      
                      <div className="relative">
                        <button onClick={() => setFilterOpen(!filterOpen)} className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${filterOpen ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 bg-[var(--color-brand-surface-1)] text-[var(--color-brand-muted)] hover:text-white'}`}>
                          <Filter size={18} />
                        </button>
                        <AnimatePresence>
                          {filterOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-12 right-0 w-64 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl shadow-2xl z-50 p-4"
                            >
                               <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Quick Filters</h5>
                               <div className="space-y-4">
                                  <div className="space-y-2">
                                     <label className="text-xs font-bold text-white/70">Status</label>
                                     <FluidDropdown 
                                        options={statusOptions}
                                        value={status}
                                        onChange={(val) => { setStatus(val); setPage(1); }}
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-xs font-bold text-white/70">Show Only Liked</label>
                                     <button 
                                       onClick={() => { setShowLikedOnly(!showLikedOnly); setFilterOpen(false); }}
                                       className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${showLikedOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 text-white/60 hover:text-white'}`}
                                     >
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Liked Favorites</span>
                                        <Heart size={14} className={showLikedOnly ? "fill-red-500" : ""} />
                                     </button>
                                  </div>
                               </div>
                               <button onClick={() => { setShowLikedOnly(false); setSearchQuery(""); setFilterOpen(false); }} className="w-full mt-6 pt-4 border-t border-white/5 text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-widest hover:text-white transition-colors">Clear All Filters</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <Link href="/dashboard/contacts/new">
                        <button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add Contact
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {editorMode ? (
                  <EditorTable
                    columns={[
                      { key: 'image', label: 'Avatar', width: '60px', render: (val: any, row: EditorRowData) => (
                        <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                          <img src={row.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.title)}&size=100`} alt="" className="w-full h-full object-cover" />
                        </div>
                      )},
                      { key: 'title', label: 'Full Name', render: (val: any) => <span className="font-bold text-white text-[13px]">{val}</span> },
                      { key: 'subtitle', label: 'Role', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '\u2014'}</span> },
                      { key: 'email', label: 'Email', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '\u2014'}</span> },
                      { key: 'status', label: 'Status', width: '120px', render: (val: any, row: EditorRowData) => (
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold cursor-pointer hover:border-white/20 transition-all active:scale-95 select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = val === 'inactive' ? 'active' : 'inactive';
                            supabase.from('contact_profiles').update({ status: newStatus }).eq('id', row.id).then(() => {
                              setContacts(prev => prev.map(c => c.id === row.id ? { ...c, status: newStatus } : c));
                            });
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${val === 'inactive' ? 'bg-red-500 text-red-500' : 'bg-[#00FA9A] text-[#00FA9A]'}`} />
                          {val === 'inactive' ? 'Inactive' : 'Active'}
                        </div>
                      )},
                    ]}
                    data={contacts.map(c => ({
                      id: c.id,
                      title: c.name_full,
                      subtitle: c.role,
                      image: c.image_url,
                      email: c.email,
                      status: c.status || 'active',
                      description: c.about,
                      location: c.location,
                      tags: c.role ? [c.role] : [],
                      meta: [
                        ...(c.email ? [{ label: 'Email', value: c.email }] : []),
                        ...(c.phone ? [{ label: 'Phone', value: c.phone }] : []),
                      ],
                    }))}
                    onEdit={(id) => router.push(`/dashboard/contacts/${id}/edit`)}
                    onDelete={async (id) => {
                      await supabase.from('contact_profiles').delete().eq('id', id);
                      setContacts(prev => prev.filter(c => c.id !== id));
                    }}
                    onRowClick={(row) => {
                      const contact = contacts.find(c => c.id === row.id);
                      if (contact) setSelectedContact(contact);
                    }}
                    selectedIds={selectedEditorIds}
                    onSelectionChange={setSelectedEditorIds}
                    actions={[
                      { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('contact_profiles').update({ status: 'active' }).eq('id', id)));
                        setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'active' } : c));
                      }},
                      { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('contact_profiles').update({ status: 'inactive' }).eq('id', id)));
                        setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'inactive' } : c));
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
                      <div key={i} className="animate-pulse bg-white/5 p-4 rounded-xl border border-white/5 h-64 flex flex-col items-center justify-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-white/10" />
                         <div className="h-4 bg-white/10 rounded w-3/4" />
                      </div>
                    ))
                  ) : contacts.length > 0 ? (
                    contacts.map((contact) => (
                      viewType === 'grid' ? (
                        <div key={contact.id} onClick={() => setSelectedContact(contact)} className="group flex flex-col h-full cursor-pointer relative text-center">
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative bg-[#1A1A1A] border border-white/5 shadow-2xl flex items-center justify-center group-hover:border-[var(--color-brand-violet)]/40 transition-all">
                             <img 
                                src={contact.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name_full)}&background=random&size=400`} 
                                alt={contact.name_full} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                             />
                             <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => toggleLike(contact.id, e)} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 z-20 hover:bg-black/80 shadow-xl transition-all"><Heart size={16} className={likedIds.includes(contact.id) ? "text-red-500 fill-red-500" : "text-white"} /></button>
                               <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(contact.id, e)} className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 z-20 hover:bg-white/20 shadow-xl transition-all"><Edit2 size={16} /></button>
                             </div>
                          </div>
                          <h4 className="font-heading text-base font-bold text-white tracking-tight truncate border-b border-transparent group-hover:border-[var(--color-brand-violet)]/20 transition-all inline-block mx-auto pb-0.5">{contact.name_full}</h4>
                          <p className="text-[11px] font-black text-[var(--color-brand-muted)] truncate mt-1 tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">{contact.role || 'Industry Professional'}</p>
                        </div>
                      ) : (
                        // List/Medium Generic Row
                        <div key={contact.id} onClick={() => setSelectedContact(contact)} className="bg-[var(--color-brand-surface-1)] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer group shadow-2xl hover:bg-white/5">
                           <img src={contact.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name_full)}&size=100`} className="w-12 h-12 rounded-lg border border-white/5 object-cover shadow-md" />
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate group-hover:text-[var(--color-brand-violet)] transition-colors">{contact.name_full}</h4>
                              <div className="flex items-center gap-3 text-[10px] text-[var(--color-brand-muted)] font-black mt-1 uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><Briefcase size={10} className="text-[var(--color-brand-violet)]" /> {contact.role}</span>
                                 <span className="flex items-center gap-1.5 border-l border-white/10 pl-3"><MapPin size={10} className="text-[var(--color-brand-violet)]" /> {contact.location}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {contact.email && <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:border-white/10 z-20 shadow-sm transition-all"><Mail size={16} /></button>}
                              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => navigateToEdit(contact.id, e)} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:border-white/10 z-20 shadow-sm transition-all"><Edit2 size={16} /></button>
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                       <div className="w-20 h-20 rounded-lg bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                          <Contact size={32} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">No contacts found</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-8 font-medium">Add industry contacts and build your CRM network.</p>
                       <Link href="/dashboard/contacts/new"><button className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">Add First Contact</button></Link>
                    </div>
                  )}
                </div>
                )}

                {contacts.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={contacts.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
         <ContactDrawer 
           isOpen={!!selectedContact} 
           onClose={() => setSelectedContact(null)} 
           data={selectedContact} 
         />
      </div>
    </div>
  )
}
