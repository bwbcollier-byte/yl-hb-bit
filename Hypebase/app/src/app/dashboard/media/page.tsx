"use client"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { 
  CheckCircle2, Users2, BadgeDollarSign, MoreVertical, 
  Trash2, Edit2, ChevronLeft, ChevronRight, Plus, X, Disc3, Music, Tag
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { BudgetCard } from "@/components/ui/analytics-bento"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { NativeDelete } from "@/components/ui/delete-button"

export default function MediaDashboard() {
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMedia, setTotalMedia] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const perPage = 10

  useEffect(() => {
    async function fetchCounts() {
      const { count } = await supabase.from("media_profiles").select("id", { count: 'exact', head: true })
      setTotalMedia(count || 0)
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const from = (currentPage - 1) * perPage
      const to = from + perPage - 1
      const { data } = await supabase
        .from("media_profiles")
        .select("id, album_name, spotify_artist_name, media_type, spotify_type, release_year, label, status, cover_art_url")
        .neq('cover_art_url', '')
        .order("id", { ascending: false })
        .range(from, to)
      
      if (data) setMedia(data)
      setLoading(false)
    }
    fetchData()
  }, [currentPage])

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectedIds(checked ? new Set(media.map(m => m.id)) : new Set())
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    checked ? newSet.add(id) : newSet.delete(id)
    setSelectedIds(newSet)
    if (!checked) setSelectAll(false)
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2">Media Dashboard</h2>
                    <p className="text-[var(--color-brand-muted)]">Manage albums, singles, and media releases</p>
                  </div>
                  <Link href="/dashboard/media/new"
                    className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Add Release
                  </Link>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                    <BudgetCard title="Total Releases" amount={totalMedia.toLocaleString()} trendLabel="+ 12%" trend="up"
                      weekData={[{ day: "Sun", value: 100 },{ day: "Mon", value: 120 },{ day: "Tue", value: 110 },{ day: "Wed", value: 180 },{ day: "Thu", value: 160 },{ day: "Fri", value: 210 },{ day: "Sat", value: 240 }]} />
                  </SpotlightCard>
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                    <BudgetCard title="Albums" amount="—" trendLabel="" trend="up"
                      weekData={[{ day: "Sun", value: 80 },{ day: "Mon", value: 90 },{ day: "Tue", value: 100 },{ day: "Wed", value: 120 },{ day: "Thu", value: 140 },{ day: "Fri", value: 130 },{ day: "Sat", value: 150 }]} />
                  </SpotlightCard>
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                    <BudgetCard title="Singles" amount="—" trendLabel="" trend="up"
                      weekData={[{ day: "Sun", value: 60 },{ day: "Mon", value: 70 },{ day: "Tue", value: 90 },{ day: "Wed", value: 80 },{ day: "Thu", value: 100 },{ day: "Fri", value: 110 },{ day: "Sat", value: 120 }]} />
                  </SpotlightCard>
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                    <BudgetCard title="Labels" amount="—" trendLabel="" trend="up"
                      weekData={[{ day: "Sun", value: 40 },{ day: "Mon", value: 50 },{ day: "Tue", value: 60 },{ day: "Wed", value: 55 },{ day: "Thu", value: 70 },{ day: "Fri", value: 65 },{ day: "Sat", value: 80 }]} />
                  </SpotlightCard>
                </div>

                {/* Table */}
                <div className="bg-[#09090b] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 rounded-lg p-5 flex flex-col">
                  <div className="w-full overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#1a1a1c] text-white/50 text-[11px] uppercase tracking-wider border-b border-white/5">
                        <tr>
                          <th className="py-4 px-4 font-bold w-12 text-center border-r border-white/5">
                            <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-3.5 h-3.5 rounded-sm border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 cursor-pointer" />
                          </th>
                          <th className="py-3 px-4 font-medium">Release</th>
                          <th className="py-3 px-4 font-medium">Artist</th>
                          <th className="py-3 px-4 font-medium">Type</th>
                          <th className="py-3 px-4 font-medium">Year</th>
                          <th className="py-3 px-4 font-medium">Label</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-transparent">
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="py-4 px-4"><div className="w-3.5 h-3.5 bg-white/5 rounded" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-3/4" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-1/3" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-12" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                              <td className="py-4 px-4"><div className="h-4 bg-white/5 rounded w-16 ml-auto" /></td>
                            </tr>
                          ))
                        ) : media.length > 0 ? media.map((m) => (
                          <tr key={m.id} className={`transition-colors cursor-pointer group border-b border-white/5 last:border-0 ${selectedIds.has(m.id) ? 'bg-[var(--color-brand-violet)]/5' : 'bg-[#09090b] hover:bg-white/5'}`}>
                            <td className="py-4 px-4 text-center border-r border-white/5" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={selectedIds.has(m.id)} onChange={(e) => handleSelect(m.id, e.target.checked)}
                                className="w-3.5 h-3.5 rounded-sm border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 cursor-pointer" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                                  {m.cover_art_url && <img src={m.cover_art_url} alt={m.album_name} className="w-full h-full object-cover" />}
                                </div>
                                <span className="font-bold text-white text-[13px] truncate max-w-[200px]">{m.album_name || "Untitled"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px]">{m.spotify_artist_name || "—"}</td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                {m.spotify_type || (m.media_type || [])[0] || "—"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px]">{m.release_year || "—"}</td>
                            <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px] truncate max-w-[120px]">{m.label || "—"}</td>
                            <td className="py-4 px-4">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold">
                                <div className={`w-2 h-2 rounded-full ${m.status === 'Pending' ? 'bg-yellow-500' : 'bg-[#00FA9A]'}`} />
                                {m.status || 'Pending'}
                              </div>
                            </td>
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <NativeDelete size="sm" buttonText="Del" confirmText="Confirm" onConfirm={() => {}} onDelete={async () => {
                                  await supabase.from("media_profiles").delete().eq("id", m.id)
                                  setMedia(prev => prev.filter(x => x.id !== m.id))
                                }} />
                                <Link href={`/dashboard/media/${m.id}/edit`}>
                                  <button className="px-3 h-8 text-[11px] font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">Edit</button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={8} className="py-10 text-center text-[var(--color-brand-muted)] italic">No media found.</td></tr>
                        )}
                      </tbody>
                    </table>
                    
                    <div className="flex justify-between items-center p-4 border-t border-white/10 bg-[var(--color-brand-surface-1)]">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        Previous
                      </button>
                      <span className="text-xs text-[var(--color-brand-muted)] font-semibold">
                        Page {currentPage} of {Math.max(1, Math.ceil(totalMedia / perPage))}
                      </span>
                      <button disabled={currentPage >= Math.ceil(totalMedia / perPage)} onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  )
}
