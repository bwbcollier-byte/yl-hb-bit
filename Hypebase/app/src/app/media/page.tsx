"use client"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { BudgetCard } from "@/components/ui/analytics-bento"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Copy, Plus, Filter, Search, 
  SlidersHorizontal, Bookmark, 
  ChevronDown, X, Heart, ArrowDown, ArrowUp, LayoutGrid, 
  LayoutList, List, ChevronLeft, ChevronRight, 
  ExternalLink, Edit2, CheckCircle2, Users2, BadgeDollarSign, 
  MoreVertical, ChevronUp, Globe, TableProperties,
  Trash2, XCircle, Disc3, Music, Layers, Calendar, Tag
} from "lucide-react"
import { 
  FaSpotify, FaTiktok, FaLinkedinIn, FaSoundcloud, 
  FaApple, FaBandcamp, FaTwitter, FaFacebookF, FaInstagram, FaYoutube,
  FaMusic, FaAmazon
} from "react-icons/fa"
import { useState, useRef, useEffect } from "react"
import { FluidDropdown, DropdownOption } from "@/components/ui/fluid-dropdown"
import { EditorTable, EditorColumnDef, EditorRowData, ActionsDropdown, EditorAction } from "@/components/ui/animated-project-cards"
import { supabase } from "@/lib/supabase"

// Streaming icon mapper
function getStreamingIcon(platform: string): { icon: any; color: string; label: string } {
  const t = platform.toLowerCase();
  if (t.includes('spotify')) return { icon: FaSpotify, color: 'text-green-500', label: 'Spotify' };
  if (t.includes('apple')) return { icon: FaApple, color: 'text-white/70', label: 'Apple Music' };
  if (t.includes('youtube')) return { icon: FaYoutube, color: 'text-red-500', label: 'YouTube Music' };
  if (t.includes('deezer')) return { icon: FaMusic, color: 'text-purple-400', label: 'Deezer' };
  if (t.includes('tidal')) return { icon: FaMusic, color: 'text-white/70', label: 'Tidal' };
  if (t.includes('soundcloud')) return { icon: FaSoundcloud, color: 'text-orange-500', label: 'SoundCloud' };
  if (t.includes('amazon')) return { icon: FaAmazon, color: 'text-yellow-500', label: 'Amazon Music' };
  if (t.includes('bandcamp')) return { icon: FaBandcamp, color: 'text-teal-400', label: 'Bandcamp' };
  if (t.includes('itunes')) return { icon: FaMusic, color: 'text-pink-400', label: 'iTunes' };
  if (t.includes('discogs')) return { icon: Disc3, color: 'text-yellow-500', label: 'Discogs' };
  if (t.includes('allmusic')) return { icon: FaMusic, color: 'text-blue-400', label: 'AllMusic' };
  if (t.includes('wikidata') || t.includes('wikipedia')) return { icon: Globe, color: 'text-neutral-400', label: 'Wikipedia' };
  return { icon: Globe, color: 'text-neutral-500', label: platform };
}

// Build streaming links array from a media record
function getStreamingLinks(record: any): { platform: string; url: string }[] {
  const links: { platform: string; url: string }[] = [];
  if (record.spotify_album_url) links.push({ platform: 'spotify', url: record.spotify_album_url });
  if (record.apple_music_url) links.push({ platform: 'apple', url: record.apple_music_url });
  if (record.youtube_music_url) links.push({ platform: 'youtube', url: record.youtube_music_url });
  if (record.deezer_url) links.push({ platform: 'deezer', url: record.deezer_url });
  if (record.tidal_url) links.push({ platform: 'tidal', url: record.tidal_url });
  if (record.soundcloud_url) links.push({ platform: 'soundcloud', url: record.soundcloud_url });
  if (record.amazon_music_url) links.push({ platform: 'amazon', url: record.amazon_music_url });
  if (record.bandcamp_url) links.push({ platform: 'bandcamp', url: record.bandcamp_url });
  if (record.itunes_url) links.push({ platform: 'itunes', url: record.itunes_url });
  if (record.discogs_url) links.push({ platform: 'discogs', url: record.discogs_url });
  if (record.allmusic_url) links.push({ platform: 'allmusic', url: record.allmusic_url });
  return links;
}

interface MediaItem {
  id: string
  albumName: string
  artistName: string
  coverArt: string
  mediaType: string
  releaseYear: string
  label: string
  trackCount: string
  status: string
  genre: string
  streamingLinks: { platform: string; url: string }[]
}

export default function MediaLibrary() {
  const router = useRouter()
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const likedIdsRef = useRef<string[]>([])
  
  useEffect(() => { likedIdsRef.current = likedIds }, [likedIds])

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortField, setSortField] = useState("id")
  const [sortAsc, setSortAsc] = useState(false)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [viewType, setViewType] = useState<'grid' | 'medium' | 'list'>('grid')
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [mediaType, setMediaType] = useState("")
  const [status, setStatus] = useState("")
  const [editorMode, setEditorMode] = useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = useState<Set<string>>(new Set())

  const mediaTypeOptions: DropdownOption[] = [
    { id: "", label: "All Types", icon: Layers, color: "#A06CD5" },
    { id: "Music/Album", label: "Albums", icon: Disc3, color: "#FF6B6B" },
    { id: "Music/Single", label: "Singles", icon: Music, color: "#4ECDC4" },
  ]

  const statusOptions: DropdownOption[] = [
    { id: "", label: "All Statuses", icon: Layers, color: "#A06CD5" },
    { id: "Updated", label: "Updated", icon: CheckCircle2, color: "#4ECDC4" },
    { id: "Pending", label: "Pending", icon: Calendar, color: "#45B7D1" },
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
    router.push(`/dashboard/media/${id}/edit`)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      // Count
      if (showLikedOnly) {
        setTotalCount(likedIdsRef.current.length)
      } else {
        try {
          let countQuery = supabase
            .from("media_profiles")
            .select("id", { count: "exact", head: true })
          
          if (searchQuery) countQuery = countQuery.ilike('album_name', `%${searchQuery}%`)
          if (mediaType) countQuery = countQuery.contains('media_type', [mediaType])
          if (status) countQuery = countQuery.eq('status', status)

          const { count } = await countQuery
          if (count !== null) setTotalCount(count)
        } catch (err: any) {
          console.error("Count query failed:", err)
          setTotalCount(463000)
        }
      }

      // Main data
      let query = supabase
        .from("media_profiles")
        .select("id, album_name, artist_name, spotify_artist_name, cover_art_url, adb_album_thumb_hq, adb_album_thumb, media_type, spotify_type, release_date, release_year, label, track_count, spotify_track_count, status, adb_genre, adb_style, spotify_album_url, apple_music_url, youtube_music_url, deezer_url, tidal_url, soundcloud_url, amazon_music_url, bandcamp_url, itunes_url, discogs_url, allmusic_url")
        .neq('cover_art_url', '')
      
      if (searchQuery) query = query.ilike('album_name', `%${searchQuery}%`)
      if (mediaType) query = query.contains('media_type', [mediaType])
      if (status) query = query.eq('status', status)

      if (showLikedOnly) {
        if (likedIdsRef.current.length === 0) {
          setMediaList([])
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
        const liveMedia: MediaItem[] = data.map((record) => ({
          id: record.id,
          albumName: record.album_name || "Untitled",
          artistName: record.spotify_artist_name || record.artist_name || "Unknown Artist",
          coverArt: record.cover_art_url || record.adb_album_thumb_hq || record.adb_album_thumb || "",
          mediaType: (record.media_type || [])[0] || record.spotify_type || "Unknown",
          releaseYear: record.release_year || (record.release_date ? record.release_date.substring(0, 4) : "—"),
          label: record.label || "—",
          trackCount: record.track_count || record.spotify_track_count || "—",
          status: record.status || "Pending",
          genre: record.adb_genre || record.adb_style || "—",
          streamingLinks: getStreamingLinks(record),
        }))
        setMediaList(liveMedia)
        setHasMore(data.length === itemsPerPage)
      } else {
        setMediaList([])
        setHasMore(false)
      }
      setTimeout(() => setIsLoading(false), 500)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField, sortAsc, showLikedOnly, itemsPerPage, searchQuery, mediaType, status])

  const clearFilters = () => {
    setSearchQuery("")
    setMediaType("")
    setStatus("")
    setShowLikedOnly(false)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

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
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Media Library</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Browse albums, singles, and media releases across your talent roster.</p>

                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { title: 'Total Releases', amount: totalCount.toLocaleString(), icon: Disc3, trendLabel: '+12%', trend: 'up' as const },
                      { title: 'Albums', amount: '—', icon: Music, trendLabel: '', trend: 'up' as const },
                      { title: 'Singles', amount: '—', icon: Tag, trendLabel: '', trend: 'up' as const },
                      { title: 'Labels', amount: '—', icon: BadgeDollarSign, trendLabel: '', trend: 'up' as const },
                    ].map((kpi, i) => (
                      <BudgetCard 
                        key={i}
                        title={kpi.title}
                        amount={kpi.amount}
                        icon={kpi.icon}
                        trendLabel={kpi.trendLabel}
                        trend={kpi.trend}
                      />
                    ))}
                  </div>

                  {/* Toolbar — matches talent layout */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={18} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                        placeholder="Search media releases..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 relative" ref={filterRef}>
                      {/* Sort direction */}
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
                                { label: "Release Date", val: "release_date" },
                                { label: "Album Name", val: "album_name" },
                                { label: "Artist", val: "spotify_artist_name" },
                                { label: "Track Count", val: "track_count" },
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

                      {/* Favorites */}
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowLikedOnly(!showLikedOnly); setPage(1) }}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${showLikedOnly ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                        title={showLikedOnly ? "Show All" : "Show Favorites Only"}
                      >
                        <Heart size={18} className={showLikedOnly ? "fill-red-500 text-red-500" : ""} />
                      </button>

                      {/* Editor toggle */}
                      <button 
                        type="button"
                        onClick={() => setEditorMode(!editorMode)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${editorMode ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30 text-[var(--color-brand-violet)]' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                        title={editorMode ? "Exit Editor" : "Editor View"}
                      >
                        <TableProperties size={18} />
                      </button>

                      {/* Bulk actions or View toggles */}
                      {editorMode ? (
                        selectedEditorIds.size > 0 && (
                          <ActionsDropdown
                            label={`${selectedEditorIds.size} Selected`}
                            targetIds={Array.from(selectedEditorIds)}
                            actions={[
                              { id: 'set-updated', label: 'Set Updated', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('media_profiles').update({ status: 'Updated' }).eq('id', id)));
                                setMediaList(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'Updated' } : m));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'set-pending', label: 'Set Pending', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('media_profiles').update({ status: 'Pending' }).eq('id', id)));
                                setMediaList(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'Pending' } : m));
                                setSelectedEditorIds(new Set());
                              }},
                              { id: 'delete', label: 'Delete Selected', icon: <Trash2 size={14} />, variant: 'danger', onClick: async (ids) => {
                                await Promise.all(ids.map(id => supabase.from('media_profiles').delete().eq('id', id)));
                                setMediaList(prev => prev.filter(m => !ids.includes(m.id)));
                                setSelectedEditorIds(new Set());
                              }},
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

                      {/* Filter */}
                      <button 
                        type="button"
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${filterOpen ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                      >
                        <Filter size={18} />
                      </button>
                      
                      {/* Add New */}
                      <Link href="/dashboard/media/new">
                        <button type="button" className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                          <Plus size={18} strokeWidth={3} /> Add New
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Filter Panel — full width, matches talent */}
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
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline" onClick={() => setSearchQuery("")}>Reset</button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                            <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                              placeholder="Album name, artist..." 
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

                        {/* Media Type */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Media Type</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline" onClick={() => setMediaType("")}>Reset</button>
                          </div>
                          <FluidDropdown 
                            options={mediaTypeOptions}
                            value={mediaType}
                            onChange={(val) => { setMediaType(val); setPage(1); }}
                          />
                        </div>

                        {/* Release Year */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--color-brand-muted)] tracking-wider uppercase">Release Year</label>
                            <button className="text-[11px] font-bold text-[var(--color-brand-violet)] hover:underline">Reset</button>
                          </div>
                          <input type="number" placeholder="2024" className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-white/5 focus:border-[var(--color-brand-violet)]/30 transition-all rounded-lg py-2.5 px-4 text-sm text-[var(--color-brand-text)]" />
                        </div>
                      </div>

                      <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <button onClick={clearFilters} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-text)] font-bold text-sm transition-all active:scale-95">
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

                {/* Editor Table */}
                {editorMode ? (
                  <EditorTable
                    columns={[
                      { key: 'image', label: 'Cover', width: '60px', render: (val: any, row: EditorRowData) => (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden border border-white/10">
                          <img src={row.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.title)}&size=100`} alt="" className="w-full h-full object-cover" />
                        </div>
                      )},
                      { key: 'title', label: 'Title', render: (val: any) => <span className="font-bold text-white text-[13px]">{val}</span> },
                      { key: 'subtitle', label: 'Artist', render: (val: any) => <span className="text-white/50 text-[13px]">{val || '—'}</span> },
                      { key: 'streamingLinks', label: 'Streaming', width: '220px', render: (_val: any, row: EditorRowData) => {
                        const links = row.streamingLinks as any[] | undefined;
                        if (!links || links.length === 0) return <span className="text-neutral-600 text-[10px] uppercase font-bold tracking-wider">—</span>;
                        return (
                          <div className="flex items-center gap-1.5 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                            {links.slice(0, 5).map((link: any, i: number) => {
                              const { icon: StreamIcon, color } = getStreamingIcon(link.platform);
                              return (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                  title={link.platform}
                                  className={`w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${color} hover:bg-white/10 hover:brightness-125 hover:border-white/15 transition-all flex-shrink-0`}
                                >
                                  <StreamIcon size={13} />
                                </a>
                              );
                            })}
                            {links.length > 5 && <span className="text-[10px] text-neutral-500 font-bold flex-shrink-0">+{links.length - 5}</span>}
                          </div>
                        );
                      }},
                      { key: 'status', label: 'Status', width: '120px', render: (val: any, row: EditorRowData) => (
                        <div 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold cursor-pointer hover:border-white/20 transition-all active:scale-95 select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = val === 'Pending' ? 'Updated' : 'Pending';
                            supabase.from('media_profiles').update({ status: newStatus }).eq('id', row.id).then(() => {
                              setMediaList(prev => prev.map(m => m.id === row.id ? { ...m, status: newStatus } : m));
                            });
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${val === 'Pending' ? 'bg-yellow-500 text-yellow-500' : 'bg-[#00FA9A] text-[#00FA9A]'}`} />
                          {val || 'Pending'}
                        </div>
                      )},
                    ]}
                    data={mediaList.map(m => ({
                      id: m.id,
                      title: m.albumName,
                      subtitle: m.artistName,
                      image: m.coverArt,
                      status: m.status,
                      streamingLinks: m.streamingLinks,
                      meta: [
                        { label: 'Year', value: m.releaseYear },
                        { label: 'Label', value: m.label },
                        { label: 'Tracks', value: m.trackCount },
                        { label: 'Genre', value: m.genre },
                      ].filter(x => x.value !== '—'),
                      tags: m.mediaType ? [m.mediaType] : [],
                    }))}
                    selectedIds={selectedEditorIds}
                    onSelectionChange={setSelectedEditorIds}
                    actions={[
                      { id: 'set-updated', label: 'Set Updated', icon: <CheckCircle2 size={14} className="text-[#00FA9A]" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('media_profiles').update({ status: 'Updated' }).eq('id', id)));
                        setMediaList(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'Updated' } : m));
                      }},
                      { id: 'set-pending', label: 'Set Pending', icon: <XCircle size={14} className="text-orange-400" />, onClick: async (ids) => {
                        await Promise.all(ids.map(id => supabase.from('media_profiles').update({ status: 'Pending' }).eq('id', id)));
                        setMediaList(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'Pending' } : m));
                      }},
                    ]}
                    onEdit={(id) => router.push(`/dashboard/media/${id}/edit`)}
                    onDelete={async (id) => {
                      await supabase.from('media_profiles').delete().eq('id', id);
                      setMediaList(prev => prev.filter(m => m.id !== id));
                    }}
                    isLoading={isLoading}
                  />
                ) : (
                /* Grid / Medium / List Views — matches talent layout */
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
                  ) : mediaList.length > 0 ? (
                    mediaList.map((media) => (
                      viewType === 'grid' ? (
                        <div 
                          key={media.id} 
                          onClick={() => router.push(`/dashboard/media/${media.id}/edit`)}
                          className="group flex flex-col h-full cursor-pointer relative text-left"
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 relative shrink-0 bg-[#1A1A1A] border border-white/5 shadow-2xl">
                            <img 
                              src={media.coverArt} 
                              alt={media.albumName} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(media.albumName)}&background=random&size=400`;
                              }}
                            />
                            
                            {/* Hover action buttons — right-aligned vertical stack like talent */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                               <button 
                                onClick={(e) => toggleLike(media.id, e)}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 transition-all z-20"
                              >
                                <Heart 
                                  size={16} 
                                  strokeWidth={2.5}
                                  className={likedIds.includes(media.id) ? "text-red-500 fill-red-500" : "text-white"} 
                                />
                              </button>
                              <button 
                                onClick={(e) => navigateToEdit(media.id, e)}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all z-20"
                              >
                                <Edit2 size={16} className="text-white" />
                              </button>
                            </div>

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Type badge */}
                            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[9px] font-bold uppercase tracking-wider text-white/80">
                              {media.mediaType}
                            </div>
                          </div>
                          
                          {/* Info — matches talent card styling */}
                          <div className="flex items-center gap-1.5 px-1 mt-1">
                            <h4 className="font-heading text-lg font-bold text-white tracking-tight truncate flex-1">{media.albumName}</h4>
                          </div>
                          
                          <p className="text-xs font-semibold text-[var(--color-brand-muted)] px-1 truncate mt-0.5 mb-1 uppercase tracking-wider">
                            {media.artistName}
                          </p>
                          <p className="text-[10px] font-semibold text-[var(--color-brand-muted)] px-1 truncate mb-3 uppercase tracking-wider opacity-50">
                            {media.releaseYear} {media.label !== '—' ? `· ${media.label}` : ''}
                          </p>

                          {/* Streaming icons — matches talent social icons */}
                          <div className="flex items-center gap-2 px-1 pb-4 overflow-x-auto no-scrollbar">
                            {media.streamingLinks.length > 0 ? (
                              media.streamingLinks.map((link, i) => {
                                const { icon: StreamIcon, color } = getStreamingIcon(link.platform);
                                return (
                                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title={link.platform} className={`p-1.5 rounded-lg bg-[#1C1C1E] border border-white/5 ${color} hover:bg-white/10 hover:brightness-125 transition-all shrink-0`}>
                                     <StreamIcon size={16} />
                                  </a>
                                )
                              })
                            ) : (
                              <div className="text-[10px] uppercase font-bold text-white/20 tracking-wider">No Streaming Links</div>
                            )}
                          </div>
                        </div>
                      ) : viewType === 'medium' ? (
                        <div 
                          key={media.id} 
                          onClick={() => router.push(`/dashboard/media/${media.id}/edit`)}
                          className="bg-[var(--color-brand-surface-1)] border border-white/5 p-6 rounded-2xl group hover:border-[var(--color-brand-violet)]/30 transition-all cursor-pointer flex gap-5 relative shadow-xl"
                        >
                           <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5 relative">
                              <img 
                                src={media.coverArt} 
                                alt={media.albumName} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(media.albumName)}&background=random&size=100`;
                                }}
                              />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                 <h4 className="font-bold text-white text-lg truncate">{media.albumName}</h4>
                                 <div className="flex items-center gap-1.5">
                                   <button 
                                      onClick={(e) => navigateToEdit(media.id, e)}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                                   >
                                      <Edit2 size={14} className="text-[var(--color-brand-muted)] hover:text-white" />
                                   </button>
                                   <button onClick={(e) => toggleLike(media.id, e)} className="p-1.5">
                                      <Heart size={16} className={likedIds.includes(media.id) ? "fill-red-500 text-red-500" : "text-[var(--color-brand-muted)]"} />
                                   </button>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1 text-[12px] text-[var(--color-brand-muted)] mb-4 font-medium">
                                 <span className="flex items-center gap-2"><Music size={12} className="text-[var(--color-brand-violet)]" /> {media.artistName}</span>
                                 <span className="flex items-center gap-2"><Calendar size={12} className="text-[var(--color-brand-violet)]" /> {media.releaseYear} {media.label !== '—' ? `· ${media.label}` : ''}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                 <div className="flex gap-2">
                                    {media.streamingLinks.slice(0, 4).map((link, i) => {
                                      const { icon: StreamIcon, color } = getStreamingIcon(link.platform);
                                      return <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`${color} hover:brightness-125 transition-all`}><StreamIcon size={14} /></a>;
                                    })}
                                 </div>
                                 <span className="text-[11px] font-bold text-[var(--color-brand-violet)] flex items-center gap-1 bg-[var(--color-brand-violet)]/10 px-2 py-1 rounded-lg">View Release <ExternalLink size={12} strokeWidth={2.5} /></span>
                              </div>
                           </div>
                        </div>
                      ) : (
                        /* List view */
                        <div 
                           key={media.id} 
                           onClick={() => router.push(`/dashboard/media/${media.id}/edit`)}
                           className="flex items-center bg-[var(--color-brand-surface-1)] border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group shadow-md"
                        >
                           <div className="flex-1 flex items-center gap-5 min-w-0 pr-6">
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5 relative group-hover:border-[var(--color-brand-violet)]/40 transition-all">
                                <img 
                                  src={media.coverArt} 
                                  alt={media.albumName} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(media.albumName)}&background=random&size=100`;
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-bold text-white truncate group-hover:text-[var(--color-brand-violet)] transition-colors">{media.albumName}</h4>
                                <span className="text-[12px] font-semibold text-[var(--color-brand-muted)] truncate uppercase tracking-wider">{media.artistName}</span>
                              </div>
                           </div>
                           
                           <div className="w-32 shrink-0 text-sm text-[var(--color-brand-muted)] font-semibold truncate px-4 hidden lg:block">
                              {media.releaseYear}
                           </div>

                           <div className="w-32 shrink-0 flex items-center justify-center px-4 hidden lg:block">
                              <div className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 inline-block">
                                {media.mediaType}
                              </div>
                           </div>

                           <div className="flex items-center gap-2 shrink-0 px-4">
                              {media.streamingLinks.slice(0, 3).map((link, i) => {
                                const { icon: StreamIcon, color } = getStreamingIcon(link.platform);
                                return (
                                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`p-1.5 rounded-lg bg-white/5 border border-white/5 ${color} hover:bg-white/10 transition-all`}>
                                    <StreamIcon size={14} />
                                  </a>
                                );
                              })}
                           </div>

                           <div className="flex items-center justify-end gap-2 shrink-0 pl-1 w-[120px]">
                              <button 
                                onClick={(e) => navigateToEdit(media.id, e)}
                                className="p-2.5 rounded-xl text-[var(--color-brand-muted)] hover:text-black hover:bg-[var(--color-brand-violet)] transition-all border border-white/5 bg-white/5"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button onClick={(e) => toggleLike(media.id, e)} className="p-2.5 rounded-xl text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10 transition-all border border-white/5 bg-white/5">
                                <Heart size={16} className={likedIds.includes(media.id) ? "fill-red-500 text-red-500" : ""} />
                              </button>
                           </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="w-24 h-24 rounded-3xl bg-[var(--color-brand-surface-2)] flex items-center justify-center mb-8 shadow-2xl border border-white/5">
                          <Search size={40} className="text-[var(--color-brand-muted)]" />
                       </div>
                       <h3 className="text-3xl font-heading font-extrabold text-white mb-3 tracking-tight">No media found</h3>
                       <p className="text-[var(--color-brand-muted)] max-w-sm mb-10 font-medium text-lg leading-relaxed">
                          We couldn't find any media matching your current search criteria.
                       </p>
                       <div className="flex items-center gap-4">
                          <button 
                            type="button"
                            onClick={clearFilters}
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

                {/* Pagination — uses PaginationBar component like talent */}
                {mediaList.length > 0 && (
                  <PaginationBar 
                    page={page} 
                    setPage={setPage} 
                    hasMore={hasMore} 
                    totalCount={totalCount} 
                    currentLength={mediaList.length} 
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    noun="records"
                  />
                )}
            </div>
         </div>
      </div>
    </div>
  )
}
