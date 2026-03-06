"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatedDownload } from "@/components/ui/animated-download"
import { Button } from "@/components/ui/button"
import { 
  User, Copy, Plus, BadgeCheck, Filter, Search, 
  Instagram, Youtube, Music2, SlidersHorizontal, Bookmark, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, Mail, Phone, 
  ExternalLink, Edit2, CheckCircle2, Users2, BadgeDollarSign, 
  MoreVertical, ChevronUp, Globe, TableProperties,
  Trash2, XCircle
} from "lucide-react"
import { 
  FaSpotify, FaTiktok, FaLinkedinIn, FaSoundcloud, 
  FaApple, FaBandcamp, FaTwitter, FaFacebookF, FaInstagram, FaYoutube,
  FaMusic
} from "react-icons/fa"

// Social icon mapper — returns the proper brand icon component for each platform
function getSocialIcon(socialType: string): { icon: any; color: string } {
  const t = socialType.toLowerCase();
  if (t.includes('instagram')) return { icon: FaInstagram, color: 'text-pink-400' };
  if (t.includes('twitter') || t.includes(' x') || t === 'x') return { icon: FaTwitter, color: 'text-sky-400' };
  if (t.includes('youtube')) return { icon: FaYoutube, color: 'text-red-500' };
  if (t.includes('facebook')) return { icon: FaFacebookF, color: 'text-blue-500' };
  if (t.includes('spotify')) return { icon: FaSpotify, color: 'text-green-500' };
  if (t.includes('tiktok')) return { icon: FaTiktok, color: 'text-white/70' };
  if (t.includes('linkedin')) return { icon: FaLinkedinIn, color: 'text-blue-400' };
  if (t.includes('soundcloud')) return { icon: FaSoundcloud, color: 'text-orange-500' };
  if (t.includes('apple')) return { icon: FaApple, color: 'text-white/70' };
  if (t.includes('deezer')) return { icon: FaMusic, color: 'text-purple-400' };
  if (t.includes('bandcamp')) return { icon: FaBandcamp, color: 'text-teal-400' };
  if (t.includes('music')) return { icon: FaSpotify, color: 'text-green-400' };
  return { icon: Globe, color: 'text-neutral-500' };
}
import { useState, useRef, useEffect } from "react"
import { SpotlightDrawer, TalentMock } from "@/components/spotlight-drawer"
import { FluidDropdown, DropdownOption } from "@/components/ui/fluid-dropdown"
import { EditorTable, EditorColumnDef, EditorRowData, ActionsDropdown, EditorAction } from "@/components/ui/animated-project-cards"
import { Mic, Camera, Trophy, Layers } from "lucide-react"
import { MOCK_TALENT } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"

export default function TalentDirectory() {
  const router = useRouter()
  const [selectedTalent, setSelectedTalent] = useState<TalentMock | null>(null)
  const [talentList, setTalentList] = useState<TalentMock[]>(MOCK_TALENT)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const likedIdsRef = useRef<string[]>([])
  
  // Keep ref in sync
  useEffect(() => {
    likedIdsRef.current = likedIds
  }, [likedIds])

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("id")
  const [sortAsc, setSortAsc] = useState(false)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [actType, setActType] = useState("")
  const [status, setStatus] = useState("")
  const [editorMode, setEditorMode] = useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = useState<Set<string>>(new Set())
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false)
  const [enrichmentType, setEnrichmentType] = useState<'MusicBrainz' | 'Spotify'>('MusicBrainz')
  const [enrichmentIds, setEnrichmentIds] = useState<string[]>([])
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentDone, setEnrichmentDone] = useState(false)
  const [enrichmentResult, setEnrichmentResult] = useState("")
  const [processedCount, setProcessedCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Spotify Enrichment Constants
  const RAPID_API_KEY = '8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9';
  const RAPID_API_HOST = 'spotify-data.p.rapidapi.com';

  useEffect(() => {
    if (enrichmentModalOpen && !isEnriching && !enrichmentDone) {
      runEnrichment()
    }
  }, [enrichmentModalOpen])

  const runEnrichment = async () => {
    setIsEnriching(true)
    setEnrichmentDone(false)
    setProcessedCount(0)
    
    if (enrichmentType === 'MusicBrainz') {
      await runMusicBrainzEnrichment()
    } else {
      await runSpotifyEnrichment()
    }
    
    setIsEnriching(false)
    setEnrichmentDone(true)
    setRefreshTrigger(prev => prev + 1)
  }

  const runMusicBrainzEnrichment = async () => {
    let total = enrichmentIds.length
    let success = 0
    let count = 0
    const now = new Date().toISOString()
    
    for (const id of enrichmentIds) {
      count++
      setProcessedCount(count)
      const talent = talentList.find(t => t.id === id)
      const spotify = talent ? (talent as any).socials?.find((s: any) => s.social_type === 'Spotify') : null
      
      if (talent && spotify) {
          const currentSpotifyLogs = Array.isArray(spotify.workflow_logs) ? spotify.workflow_logs : []
          const currentTalentLogs = Array.isArray((talent as any).workflow_logs) ? (talent as any).workflow_logs : []
          
          let url = spotify.social_url || `https://open.spotify.com/artist/${spotify.social_id}`
          try {
            const res = await fetch(`https://musicbrainz.org/ws/2/url?resource=${encodeURIComponent(url)}&inc=artist-rels&fmt=json`, { 
              headers: { 'Accept': 'application/json', 'User-Agent': 'HBTalentMusicProfiles/1.0 (contact@yunikon-labs.com)' }
            })
            if (!res.ok) {
               const log = { workflow: "MusicBrainz_Spotify_Linker", date: now, result: "Failed - HTTP Error", status: "error" }
               await supabase.from('talent_profiles').update({ workflow_logs: [...currentTalentLogs, log] }).eq('id', id)
               await supabase.from('social_profiles').update({ workflow_logs: [...currentSpotifyLogs, log] }).eq('id', spotify.id)
            } else {
               const data = await res.json()
               const artistRel = data.relations?.find((r: any) => r['target-type'] === 'artist' || r.artist)
               if (artistRel && artistRel.artist) {
                   const mbid = artistRel.artist.id
                   const mbName = artistRel.artist.name
                   const log = { workflow: "MusicBrainz_Spotify_Linker", date: now, result: `Success - Found MBID ${mbid}`, status: "success" }
                    await supabase.from('talent_profiles').update({ musicbrainz_id: mbid, workflow_logs: [...currentTalentLogs, log] }).eq('id', id)
                    await supabase.from('social_profiles').update({ workflow_logs: [...currentSpotifyLogs, log] }).eq('id', spotify.id)
                    
                    // Update local state immediately for log visibility
                    setTalentList(prev => prev.map(t => t.id === id ? { ...t, musicbrainz_id: mbid, workflow_logs: [...currentTalentLogs, log] } : t))
                   
                   const { data: existingMB } = await supabase.from('social_profiles').select('id').eq('talent_id', id).eq('social_type', 'MusicBrainz').maybeSingle()
                   if (!existingMB) {
                       await supabase.from('social_profiles').insert({
                           talent_id: id, social_type: 'MusicBrainz', social_id: mbid, name: mbName,
                           username: mbName.toLowerCase().replace(/[^a-z0-9]/g, ''), social_url: `https://musicbrainz.org/artist/${mbid}`,
                           status: null, linking_status: 'done', created_at: now, updated_at: now,
                           workflow_logs: []
                       })
                   }
                   success++
                } else {
                   const log = { workflow: "MusicBrainz_Spotify_Linker", date: now, result: "Not Found - No artist profile matches.", status: "skipped_not_found" }
                   await supabase.from('talent_profiles').update({ workflow_logs: [...currentTalentLogs, log] }).eq('id', id)
                   await supabase.from('social_profiles').update({ workflow_logs: [...currentSpotifyLogs, log] }).eq('id', spotify.id)
               }
            }
          } catch (e) {
              const log = { workflow: "MusicBrainz_Spotify_Linker", date: now, result: "Failed - Exception thrown", status: "error" }
              await supabase.from('talent_profiles').update({ workflow_logs: [...currentTalentLogs, log] }).eq('id', id)
              await supabase.from('social_profiles').update({ workflow_logs: [...currentSpotifyLogs, log] }).eq('id', spotify.id)
          }
      } else if (talent) {
          const currentTalentLogs = Array.isArray((talent as any).workflow_logs) ? (talent as any).workflow_logs : []
          const log = { workflow: "MusicBrainz_Spotify_Linker", date: now, result: "Skipped - No linked Spotify profile.", status: "skipped_not_found" }
          await supabase.from('talent_profiles').update({ workflow_logs: [...currentTalentLogs, log] }).eq('id', id)
      }
    }
    setEnrichmentResult(`Processed ${total} records.\nFound ${success} MusicBrainz links.`);
  }

  const runSpotifyEnrichment = async () => {
    let total = enrichmentIds.length
    let success = 0
    let count = 0
    const now = new Date().toISOString()
    
    for (const id of enrichmentIds) {
      count++
      setProcessedCount(count)
      const talent = talentList.find(t => t.id === id)
      const spotify = talent ? (talent as any).socials?.find((s: any) => s.social_type === 'Spotify') : null
      
      if (talent && spotify && spotify.social_id) {
          const currentSpotifyLogs = Array.isArray(spotify.workflow_logs) ? spotify.workflow_logs : []
          const currentTalentLogs = Array.isArray((talent as any).workflow_logs) ? (talent as any).workflow_logs : []
          
          try {
            const res = await fetch(`https://${RAPID_API_HOST}/artist_overview/?id=${spotify.social_id}`, {
              headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST }
            })
            
            if (res.ok) {
              const data = await res.json()
              const artist = data.data?.artist || data.data?.artistUnion
              if (artist) {
                const apiProfile = artist.profile || {}
                const stats = artist.stats || {}
                const visualSources = artist.visuals?.avatarImage?.sources || []
                const largestAvatar = [...visualSources].sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0]
                
                const talentUpdate: any = { updated_at: now }
                if (artist.genres) {
                  const genreList = Array.isArray(artist.genres) ? artist.genres : (artist.genres.genres || []);
                  talentUpdate.sp_genres = Array.isArray(genreList) ? genreList.join(', ') : genreList;
                }
                if (artist.popularity) talentUpdate.sp_popularity = artist.popularity;
                if (!talent.imageUrl && largestAvatar?.url) talentUpdate.sp_image = largestAvatar.url;
                
                // New fields
                if (stats.followers) talentUpdate.sp_followers = stats.followers;
                if (stats.monthlyListeners) talentUpdate.sp_listeners = stats.monthlyListeners;
                
                const logEntry = { workflow: "Spotify_Intelligence", date: now, result: "Success - Enriched genres, popularity, stats and visuals", status: "success" }
                talentUpdate.workflow_logs = [...currentTalentLogs, logEntry]
                
                await supabase.from('talent_profiles').update(talentUpdate).eq('id', id)
                
                const spotifyUpdate = { 
                  updated_at: now, 
                  followers_count: stats.followers || null,
                  following: stats.monthlyListeners || null, 
                  workflow_logs: [...currentSpotifyLogs, logEntry] 
                }
                
                await supabase.from('social_profiles').update(spotifyUpdate).eq('id', spotify.id)
                
                // Update local state immediately for log visibility and data consistency
                setTalentList(prev => prev.map(t => {
                  if (t.id === id) {
                    const newSocials = (t as any).socials?.map((s: any) => s.id === spotify.id ? { ...s, ...spotifyUpdate } : s) || []
                    return { 
                      ...t, 
                      ...talentUpdate, 
                      socials: newSocials 
                    }
                  }
                  return t
                }))
                
                success++
              }
            }
          } catch (e) {
            console.error('Spotify Enrichment Error', e)
          }
      }
    }
    setEnrichmentResult(`Processed ${total} records.\nUpdated ${success} Spotify profiles.`);
  }
  const handleAnimationComplete = () => {
    setIsEnriching(false)
    setEnrichmentDone(true)
    // Small delay to ensure DB consistency before re-fetch
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 800)
  }

  const actTypeOptions: DropdownOption[] = [
    { id: "", label: "All Types", icon: Layers, color: "#A06CD5" },
    { id: "artist", label: "Artist", icon: Mic, color: "#FF6B6B" },
    { id: "creator", label: "Creator", icon: Camera, color: "#4ECDC4" },
    { id: "athlete", label: "Athlete", icon: Trophy, color: "#45B7D1" }
  ]

  const statusOptions: DropdownOption[] = [
    { id: "", label: "All Statuses", icon: Layers, color: "#A06CD5" },
    { id: "active", label: "Active", icon: CheckCircle2, color: "#4ECDC4" },
    { id: "inactive", label: "Inactive", icon: X, color: "#FF6B6B" }
  ]
  
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close popovers on outside click
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
    router.push(`/dashboard/talent/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      // 1. Fetch total count separately (lighter) without blocking main load
      if (showLikedOnly) {
        setTotalCount(likedIdsRef.current.length)
      } else {
        try {
          const { count } = await supabase
            .from("talent_profiles")
            .select("id", { count: "planned", head: true })
            .or('profile_image.not.is.null,sp_image.not.is.null,tmdb_image.not.is.null,imdb_image.not.is.null')
            
          if (count !== null) setTotalCount(count)
        } catch (err: any) {
          console.error("Count query failed, using fallback:", err)
          setTotalCount(1000)
        }
      }

      // 2. Fetch main data
      let query = supabase
        .from("talent_profiles")
        .select("*")
      
      // Filter for profiles with images
      query = query.or('profile_image.not.is.null,sp_image.not.is.null,tmdb_image.not.is.null,imdb_image.not.is.null')
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      if (showLikedOnly) {
        if (likedIdsRef.current.length === 0) {
          setTalentList([])
          setHasMore(false)
          setTotalCount(0)
          setIsLoading(false)
          return
        }
        query = query.in("id", likedIdsRef.current)
      }

      const { data, error } = await query
        .order(sortField, { ascending: sortAsc })
        .range(from, to)
      
      if (data && data.length > 0) {
        const talentIds = data.map(d => d.id)
        
        let socialsData: any[] = []
        try {
          const { data: sData } = await supabase.from('social_profiles').select('*').in('talent_id', talentIds).neq('status', 'skipped_not_found')
          if (sData) socialsData = sData
        } catch (e) {
          console.error("Error fetching socials", e)
        }

        const liveTalent = data.map((record) => ({
          id: record.id || record.airtable_id || Math.random().toString(),
          airtable_id: record.airtable_id,
          name: record.name || "Unknown Artist",
          category: record.act_type || record.sp_type || record.professions || "Artist",
          location: record.location || "Location Unknown", 
          verifiedAt: record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "Recently",
          momentumGrowth: 0,
          managerName: record.com_management || "N/A",
          managerEmail: record.com_email || record.com_email_1 || "N/A",
          brandConflicts: [],
          imageUrl: record.sp_image || record.sp_avatar_image_urls || record.profile_image || record.tmdb_image || record.imdb_image || record.mf_image || "",
          company: record.com_management || "N/A",
          socials: socialsData.filter(s => s.talent_id === record.id),
          workflow_logs: record.workflow_logs || [],
          genres: record.sp_genres || record.genres || [],
          popularity: record.sp_popularity || record.popularity || 0
        }))
        setTalentList(liveTalent)
        setHasMore(data.length === itemsPerPage)
      } else {
        setTalentList([])
        setHasMore(false)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, searchQuery, refreshTrigger])

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
            <div className="max-w-[1400px] mx-auto">
                <div className="px-2 mb-10">
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Talent Directory</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Browse verified global talent and direct management contacts.</p>

                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Tasks completed', value: '1080', icon: CheckCircle2, growth: '+20%' },
                      { label: 'Contacts created', value: '320', icon: Users2, growth: '+20%' },
                      { label: 'Deals Signed', value: '124', icon: CheckCircle2, growth: '+20%' },
                      { label: 'Revenue generated', value: '$13,666', icon: BadgeDollarSign, growth: '+20%' }
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
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                        placeholder="Search talent profiles..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative" ref={filterRef}>
                      {/* Sort controls */}
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
                                { label: "Created Date", val: "created_at" },
                                { label: "Last Modified", val: "updated_at" },
                                { label: "Talent Name", val: "name" }
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
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowLikedOnly(!showLikedOnly); setPage(1) }}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${showLikedOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                        title={showLikedOnly ? "Show All" : "Show Favorites Only"}
                      >
                        <Heart size={18} className={showLikedOnly ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => setEditorMode(!editorMode)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${editorMode ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                        title={editorMode ? "Exit Editor" : "Editor View"}
                      >
                        <TableProperties size={18} />
                      </button>

                      {editorMode ? (
                        selectedEditorIds.size > 0 && (
                          <ActionsDropdown
                            label={`${selectedEditorIds.size} Selected`}
                            targetIds={Array.from(selectedEditorIds)}
                            actions={[
                              { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('talent_profiles').update({ status: 'active' }).eq('id', id)));
                                setTalentList(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'active' } : t));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('talent_profiles').update({ status: 'inactive' }).eq('id', id)));
                                setTalentList(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'inactive' } : t));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'delete', label: 'Delete Selected', icon: <Trash2 size={14} />, variant: 'danger', onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('talent_profiles').delete().eq('id', id)));
                                setTalentList(prev => prev.filter(t => !ids.includes(t.id)));
                                setSelectedEditorIds(new Set());
                              }},
                              ...(Array.from(selectedEditorIds).some(id => {
                                 const t = talentList.find(x => x.id === id);
                                  return (t as any)?.socials?.some((s: any) => s.social_type?.toLowerCase() === 'spotify')
                              }) ? [
                                {
                                  id: 'bulk-musicbrainz-enrich',
                                  label: 'MusicBrainz Enrichment',
                                  icon: <Music2 size={14} className="text-[var(--color-brand-violet)]" />,
                                  onClick: async (ids: string[]) => {
                                    const spotifyIds = ids.filter(id => {
                                       const t = talentList.find(x => x.id === id)
                                       return (t as any)?.socials?.some((s: any) => s.social_type?.toLowerCase() === 'spotify')
                                    });
                                    if (spotifyIds.length > 0) {
                                       setEnrichmentIds(spotifyIds);
                                       setEnrichmentType('MusicBrainz');
                                       setEnrichmentModalOpen(true);
                                       setEnrichmentDone(false);
                                       setEnrichmentResult("");
                                    }
                                  }
                                },
                                {
                                  id: 'bulk-spotify-enrich',
                                  label: 'Spotify Enrichment',
                                  icon: <FaSpotify size={14} className="text-[#1DB954]" />,
                                  onClick: async (ids: string[]) => {
                                    const spotifyIds = ids.filter(id => {
                                       const t = talentList.find(x => x.id === id)
                                       return (t as any)?.socials?.some((s: any) => s.social_type?.toLowerCase() === 'spotify')
                                    });
                                    if (spotifyIds.length > 0) {
                                       setEnrichmentIds(spotifyIds);
                                       setEnrichmentType('Spotify');
                                       setEnrichmentModalOpen(true);
                                       setEnrichmentDone(false);
                                       setEnrichmentResult("");
                                    }
                                  }
                                }
                              ] : [])
                            ]}
                          />
                        )
                      ) : (
                        <div className="flex items-center p-1 bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg">
                          <button 
                            onClick={() => setViewType('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
                          >
                             <LayoutGrid size={16} />
                          </button>
                          <button 
                            onClick={() => setViewType('medium')}
                            className={`p-1.5 rounded-lg transition-all ${viewType === 'medium' ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
                          >
                             <LayoutList size={16} />
                          </button>
                          <button 
                            onClick={() => setViewType('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewType === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
                          >
                             <List size={16} />
                          </button>
                        </div>
                      )}

                      <button 
                        type="button"
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      
                      <Link href="/dashboard/talent/new">
                        <button type="button" className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add New
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
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Keyword Search</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                              placeholder="Name, tag, etc..." 
                              className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 pl-9 pr-4 text-sm text-[var(--color-brand-text)]" 
                            />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Status</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline" onClick={() => setStatus("")}>Reset</button>
                          </div>
                          <FluidDropdown 
                            options={statusOptions}
                            value={status}
                            onChange={(val) => { setStatus(val); setPage(1); }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Act Type</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline" onClick={() => setActType("")}>Reset</button>
                          </div>
                          <FluidDropdown 
                            options={actTypeOptions}
                            value={actType}
                            onChange={(val) => { setActType(val); setPage(1); }}
                          />
                        </div>

                        {/* Reach */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Minimum Reach</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <input type="number" placeholder="50k" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)]" />
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-sm transition-all active:scale-95">
                          Reset All Filters
                        </button>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setFilterOpen(false)}
                            className="px-4 py-2 rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] font-bold text-sm transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => setFilterOpen(false)}
                            className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)] text-sm"
                          >
                            Apply Results
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editorMode ? (
                  <EditorTable
                    columns={[
                      { key: 'image', label: 'Image', width: '60px', render: (val: any, row: EditorRowData) => (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden border border-white/10">
                          <img src={row.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.title)}&size=100`} alt="" className="w-full h-full object-cover" />
                        </div>
                      )},
                      { key: 'title', label: 'Name', render: (val: any) => <span className="font-bold text-white text-[13px]">{val}</span> },
                      { key: 'subtitle', label: 'Act Type', render: (val: any, row: EditorRowData) => (
                        <div className="flex items-center gap-4">
                          <span className="text-white/50 text-[13px]">{val || '—'}</span>
                          {isEnriching && enrichmentIds.includes(row.id) && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-brand-violet)]/10 border border-[var(--color-brand-violet)]/20 shadow-sm">
                              <div className="w-3 h-3 border-2 border-[var(--color-brand-violet)] border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] font-bold text-[var(--color-brand-violet)] uppercase tracking-wide">MB Link</span>
                            </div>
                          )}
                        </div>
                      )},
                      { key: 'socials', label: 'Socials', width: '220px', render: (_val: any, row: EditorRowData) => {
                        const socials = row.socials as any[] | undefined;
                        if (!socials || socials.length === 0) return <span className="text-neutral-600 text-[10px] uppercase font-bold tracking-wider">—</span>;
                        return (
                          <div className="flex items-center gap-1.5 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                            {socials.slice(0, 5).map((s: any) => {
                              const { icon: SocialIcon, color } = getSocialIcon(s.social_type || '');
                              return (
                                <a key={s.id} href={s.social_url} target="_blank" rel="noopener noreferrer"
                                  title={s.social_type}
                                  className={`w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${color} hover:bg-white/10 hover:brightness-125 hover:border-white/15 transition-all flex-shrink-0`}
                                >
                                  <SocialIcon size={13} />
                                </a>
                              );
                            })}
                            {socials.length > 5 && <span className="text-[10px] text-neutral-500 font-bold flex-shrink-0">+{socials.length - 5}</span>}
                          </div>
                        );
                      }},
                      { key: 'status', label: 'Status', width: '120px', render: (val: any, row: EditorRowData) => (
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold cursor-pointer hover:border-white/20 transition-all active:scale-95 select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = val === 'inactive' ? 'active' : 'inactive';
                            supabase.from('talent_profiles').update({ status: newStatus }).eq('id', row.id).then(() => {
                              setTalentList(prev => prev.map(t => t.id === row.id ? { ...t, status: newStatus } : t));
                            });
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${val === 'inactive' ? 'bg-red-500 text-red-500' : 'bg-[#00FA9A] text-[#00FA9A]'}`} />
                          {val === 'inactive' ? 'Inactive' : 'Active'}
                        </div>
                      )},
                    ]}
                    data={talentList.map(t => {
                      const talentLogs = Array.isArray(t.workflow_logs) ? t.workflow_logs : [];
                      const socialLogs = (t as any).socials?.flatMap((s: any) => Array.isArray(s.workflow_logs) ? s.workflow_logs : []) || [];
                      
                      // Combine and sort by date ascending (oldest first) 
                      // because the popover component reverses them to put newest on top.
                      const combinedLogs = [...talentLogs, ...socialLogs].sort((a, b) => {
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateA - dateB;
                      });

                      // De-duplicate by workflow + result (since date might be same if logged to both)
                      const seen = new Set();
                      const uniqueLogs = combinedLogs.filter(log => {
                        if (!log.workflow || !log.date) return false;
                        const key = `${log.workflow}_${log.result}_${log.date}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });
                      
                      if (uniqueLogs.length > 0 && t.name.includes("Artists_Name_For_Testing")) {
                         console.log(`Logs for ${t.name}:`, uniqueLogs);
                      }

                      return {
                        id: t.id,
                        title: t.name,
                        subtitle: t.category,
                        image: t.imageUrl,
                        status: (t as any).status || 'active',
                        location: t.location,
                        tags: t.category ? [t.category] : [],
                        socials: (t as any).socials || [],
                        workflow_logs: uniqueLogs
                      };
                    })}
                    selectedIds={selectedEditorIds}
                    onSelectionChange={setSelectedEditorIds}
                    actions={[
                      { id: 'set-active', label: 'Set Active', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('talent_profiles').update({ status: 'active' }).eq('id', id)));
                        setTalentList(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'active' } : t));
                      }},
                      { id: 'set-inactive', label: 'Set Inactive', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('talent_profiles').update({ status: 'inactive' }).eq('id', id)));
                        setTalentList(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'inactive' } : t));
                      }},
                      { 
                        id: 'musicbrainz-enrich', 
                        label: 'MusicBrainz Enrichment', 
                        icon: <Music2 size={14} className="text-purple-400" />, 
                        showIf: (row) => row?.socials?.some((s: any) => s.social_type?.toLowerCase() === 'spotify') ?? false,
                        onClick: async (ids) => {
                          setEnrichmentType('MusicBrainz');
                          setEnrichmentIds(ids);
                          setEnrichmentModalOpen(true);
                          setEnrichmentDone(false);
                          setEnrichmentResult("");
                        }
                      },
                      { 
                        id: 'spotify-enrich', 
                        label: 'Spotify Enrichment', 
                        icon: <FaSpotify size={14} className="text-[#1DB954]" />, 
                        showIf: (row) => row?.socials?.some((s: any) => s.social_type?.toLowerCase() === 'spotify') ?? false,
                        onClick: async (ids) => {
                          setEnrichmentType('Spotify');
                          setEnrichmentIds(ids);
                          setEnrichmentModalOpen(true);
                          setEnrichmentDone(false);
                          setEnrichmentResult("");
                        }
                      },
                    ]}
                    onEdit={(id) => router.push(`/dashboard/talent/${id}/edit`)}
                    onDelete={async (id) => {
                      await supabase.from('talent_profiles').delete().eq('id', id);
                      setTalentList(prev => prev.filter(t => t.id !== id));
                    }}
                    onRowClick={(row) => {
                      const talent = talentList.find(t => t.id === row.id);
                      if (talent) setSelectedTalent(talent);
                    }}
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
                      <div key={i} className={`animate-pulse bg-white/5 p-4 rounded-xl border border-white/5 ${viewType === 'list' ? 'flex items-center gap-4' : ''}`}>
                         <div className={`bg-white/10 rounded-lg ${viewType === 'grid' ? 'aspect-square w-full mb-4' : viewType === 'medium' ? 'w-16 h-16 shrink-0' : 'w-12 h-12 shrink-0'}`} />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                            {viewType !== 'grid' && <div className="h-3 bg-white/10 rounded w-1/4" />}
                         </div>
                      </div>
                    ))
                  ) : talentList.length > 0 ? (
                    talentList.map((talent) => (
                      viewType === 'grid' ? (
                        <div 
                          key={talent.id} 
                          onClick={() => setSelectedTalent(talent)} 
                          className="group flex flex-col h-full cursor-pointer relative text-left"
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative shrink-0 bg-[#1A1A1A] border border-white/5 shadow-2xl">
                            <img 
                              src={talent.imageUrl} 
                              alt={talent.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.name)}&background=random&size=400`;
                              }}
                            />
                            
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                               <button 
                                onClick={(e) => toggleLike(talent.id, e)}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all z-20"
                              >
                                <Heart 
                                  size={16} 
                                  strokeWidth={2.5}
                                  className={likedIds.includes(talent.id) ? "text-red-500 fill-red-500" : "text-white"} 
                                />
                              </button>
                              <button 
                                onClick={(e) => navigateToEdit(talent.id, e)}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all z-20"
                              >
                                <Edit2 size={16} className="text-white" />
                              </button>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <div className="flex items-center gap-1.5 px-1 mt-1">
                            <h4 className="font-heading text-lg font-bold text-white tracking-tight truncate flex-1">{talent.name}</h4>
                            <BadgeCheck fill="#FFFFFF" strokeWidth={2} className="text-black dark:text-black flex-shrink-0" size={18} />
                          </div>
                          
                          <p className="text-xs font-semibold text-[var(--color-brand-muted)] px-1 truncate mt-0.5 mb-3 uppercase tracking-wider">
                            {talent.category}
                          </p>

                          <div className="flex items-center gap-2 px-1 pb-4 overflow-x-auto no-scrollbar">
                            {talent.socials && talent.socials.length > 0 ? (
                               talent.socials.map((social: any) => {
                                   const { icon: SocialIcon, color } = getSocialIcon(social.social_type || '');
                                   return (
                                      <a key={social.id} href={social.social_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title={social.social_type} className={`p-1.5 rounded-lg bg-[#1C1C1E] border border-white/5 ${color} hover:bg-white/10 hover:brightness-125 transition-all shrink-0`}>
                                         <SocialIcon size={16} />
                                      </a>
                                   )
                                })
                            ) : (
                               <div className="text-[10px] uppercase font-bold text-white/20 tracking-wider">No Socials Found</div>
                            )}
                          </div>
                        </div>
                      ) : viewType === 'medium' ? (
                        <div 
                          key={talent.id} 
                          onClick={() => setSelectedTalent(talent)} 
                          className="bg-[var(--color-brand-surface-1)] border border-white/5 p-6 rounded-2xl group hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer flex gap-5 relative shadow-xl"
                        >
                           <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5 relative">
                              <img 
                                src={talent.imageUrl} 
                                alt={talent.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.name)}&background=random&size=100`;
                                }}
                              />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                 <h4 className="font-bold text-white text-lg truncate">{talent.name}</h4>
                                 <div className="flex items-center gap-1.5">
                                   <button 
                                      onClick={(e) => navigateToEdit(talent.id, e)}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                                   >
                                      <Edit2 size={14} className="text-[var(--color-brand-muted)] hover:text-white" />
                                   </button>
                                   <button onClick={(e) => toggleLike(talent.id, e)} className="p-1.5">
                                      <Heart size={16} className={likedIds.includes(talent.id) ? "fill-red-500 text-red-500" : "text-[var(--color-brand-muted)]"} />
                                   </button>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1 text-[12px] text-[var(--color-brand-muted)] mb-4 font-medium">
                                 <span className="flex items-center gap-2"><Mail size={12} className="text-[var(--color-brand-violet)]" /> {talent.managerEmail}</span>
                                 <span className="flex items-center gap-2"><Phone size={12} className="text-[var(--color-brand-violet)]" /> Manager Contact Available</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                 <div className="flex gap-3">
                                     <FaTwitter size={14} className="text-white/40 hover:text-white transition-colors" />
                                    <Instagram size={14} className="text-white/40 hover:text-white transition-colors" />
                                 </div>
                                 <span className="text-[11px] font-bold text-[var(--color-brand-violet)] flex items-center gap-1 bg-[var(--color-brand-violet)]/10 px-2 py-1 rounded-lg">View Profile <ExternalLink size={12} strokeWidth={2.5} /></span>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div 
                           key={talent.id} 
                           onClick={() => setSelectedTalent(talent)} 
                           className="flex items-center bg-[var(--color-brand-surface-1)] border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group shadow-md"
                        >
                           <div className="flex-1 flex items-center gap-5 min-w-0 pr-6">
                              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white/5 relative group-hover:border-[var(--color-brand-violet)]/40 transition-all">
                                <img 
                                  src={talent.imageUrl} 
                                  alt={talent.name} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent.name)}&background=random&size=100`;
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-bold text-white truncate group-hover:text-[var(--color-brand-violet)] transition-colors">{talent.name}</h4>
                                <span className="text-[12px] font-semibold text-[var(--color-brand-muted)] truncate uppercase tracking-wider">{talent.category}</span>
                              </div>
                           </div>
                           
                           <div className="w-64 shrink-0 text-sm text-[var(--color-brand-muted)] font-mono truncate px-4 hidden lg:block opacity-60">
                              #{talent.id.slice(0, 8)}...
                           </div>

                           <div className="w-32 shrink-0 flex items-center justify-center px-4">
                              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" /> VERIFIED
                              </div>
                           </div>

                           <div className="flex items-center justify-end gap-2 shrink-0 pl-1 w-[320px]">
                              <button className="p-2.5 rounded-xl text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10 transition-all border border-white/5 bg-white/5">
                                <Search size={16} />
                              </button>
                              <button className="p-2.5 rounded-xl text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10 transition-all border border-white/5 bg-white/5">
                                <Bookmark size={16} />
                              </button>
                              <button 
                                onClick={(e) => navigateToEdit(talent.id, e)}
                                className="p-2.5 rounded-xl text-[var(--color-brand-muted)] hover:text-black hover:bg-[var(--color-brand-violet)] transition-all border border-white/5 bg-white/5"
                              >
                                <Edit2 size={16} />
                              </button>
                              
                              <div className="h-6 w-px bg-white/10 mx-2" />
                              
                              <div className="relative group/status flex-1">
                                <select className="w-full appearance-none bg-[var(--color-brand-surface-2)] border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-bold outline-none cursor-pointer hover:bg-white/10 transition-all pr-8">
                                  <option>ACTIVE</option>
                                  <option>PAUSED</option>
                                  <option>ARCHIVED</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/status:opacity-100 transition-opacity" />
                              </div>
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="w-24 h-24 rounded-3xl bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-8 shadow-2xl border border-white/5">
                          <Search size={40} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-3xl font-heading font-extrabold text-white mb-3 tracking-tight">No talent found</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-10 font-medium text-lg leading-relaxed">
                          We couldn't find any talent matching your current search criteria.
                       </p>
                       <div className="flex items-center gap-4">
                          <button 
                            type="button"
                            onClick={() => { setShowLikedOnly(false); setSearchQuery(""); setPage(1) }}
                            className="px-8 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold text-sm transition-all shadow-lg active:scale-95"
                          >
                            Clear All Filters
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setFilterOpen(true); setPage(1) }}
                            className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]"
                          >
                            New Search
                          </button>
                       </div>
                    </div>
                  )}
                </div>
                )}

                {talentList.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={talentList.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
      </div>

      <SpotlightDrawer 
        isOpen={selectedTalent !== null} 
        onClose={() => setSelectedTalent(null)} 
        talent={selectedTalent} 
      />

      {enrichmentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#09090b] border border-white/10 rounded-lg p-10 max-w-2xl w-full mx-4 shadow-2xl relative shadow-[0_0_50px_rgba(138,43,226,0.1)]">
                <button 
                   onClick={() => !isEnriching && setEnrichmentModalOpen(false)}
                   className={`absolute top-6 right-6 transition-colors ${isEnriching ? 'text-white/20 cursor-not-allowed' : 'text-white/50 hover:text-white'}`}
                   disabled={isEnriching}
                >
                    <X size={24} />
                </button>
                
                <div className="flex flex-col items-center py-4">
                   <div className="w-16 h-16 rounded-lg bg-[var(--color-brand-violet)]/20 flex items-center justify-center mb-6 border border-[var(--color-brand-violet)]/30">
                     {enrichmentType === 'MusicBrainz' ? <Music2 size={32} className="text-[var(--color-brand-violet)]" /> : <FaSpotify size={32} className="text-[#1DB954]" />}
                   </div>
                   <h2 className="text-3xl font-heading font-extrabold text-white mb-3">
                     {enrichmentType === 'MusicBrainz' ? 'MusicBrainz Engine' : 'Spotify Intelligence'}
                   </h2>
                   <p className="text-white/50 mb-10 text-center max-w-md font-medium">
                       {enrichmentType === 'MusicBrainz' 
                         ? 'This engine securely connects to MusicBrainz servers to synchronize artist metadata based on Spotify URIs.' 
                         : 'Our intelligence engine scrapes real-time artist genres, popularity, and high-res visuals directly from Spotify.'}
                   </p>
                   
                   <div className="w-full flex flex-col items-center">
                     <div className="min-h-[200px] flex flex-col items-center justify-center w-full">
                       <AnimatedDownload 
                          width={1200}
                          height={200}
                          className="max-w-full"
                          isAnimating={isEnriching || (!isEnriching && !enrichmentDone)}
                          onAnimationComplete={handleAnimationComplete} 
                          totalRecords={enrichmentIds.length}
                          processedRecords={processedCount}
                       />

                       {enrichmentDone && (
                           <div className="text-center animate-in zoom-in-95 duration-300 fill-mode-forwards w-full mt-6">
                              <p className="text-emerald-400 font-medium whitespace-pre-line text-sm bg-emerald-500/5 px-6 py-4 rounded-lg border border-emerald-500/10 mb-6 mx-auto inline-block text-left">{enrichmentResult}</p>
                           </div>
                       )}
                     </div>
                   </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
