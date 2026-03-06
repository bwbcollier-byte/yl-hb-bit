"use client"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ArrowLeft, Save, Disc3, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function EditMediaProfile() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    album_name: "",
    spotify_artist_name: "",
    media_type: ["Music/Album"],
    spotify_type: "ALBUM",
    release_date: "",
    release_year: "",
    label: "",
    track_count: "",
    status: "Pending",
    cover_art_url: "",
    spotify_album_url: "",
    apple_music_url: "",
    youtube_music_url: "",
    deezer_url: "",
    tidal_url: "",
    soundcloud_url: "",
    amazon_music_url: "",
    bandcamp_url: "",
  })

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("media_profiles").select("*").eq("id", id).single()
      if (data) {
        setForm({
          album_name: data.album_name || "",
          spotify_artist_name: data.spotify_artist_name || "",
          media_type: data.media_type || ["Music/Album"],
          spotify_type: data.spotify_type || "ALBUM",
          release_date: data.release_date || "",
          release_year: data.release_year || "",
          label: data.label || "",
          track_count: data.track_count || "",
          status: data.status || "Pending",
          cover_art_url: data.cover_art_url || "",
          spotify_album_url: data.spotify_album_url || "",
          apple_music_url: data.apple_music_url || "",
          youtube_music_url: data.youtube_music_url || "",
          deezer_url: data.deezer_url || "",
          tidal_url: data.tidal_url || "",
          soundcloud_url: data.soundcloud_url || "",
          amazon_music_url: data.amazon_music_url || "",
          bandcamp_url: data.bandcamp_url || "",
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("media_profiles").update({
        ...form,
        release_year: form.release_date ? form.release_date.substring(0, 4) : form.release_year,
      }).eq("id", id)
      if (error) throw error
      router.push("/dashboard/media")
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this release?")) return
    await supabase.from("media_profiles").delete().eq("id", id)
    router.push("/dashboard/media")
  }

  const inputClass = "w-full h-10 px-4 rounded-lg bg-[var(--color-brand-surface-1)] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-brand-violet)] transition-all"

  if (loading) {
    return (
      <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)]">
        <div className="hidden md:block w-[84px] shrink-0 relative z-50"><ObsidianSidebar /></div>
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          <TopHeader />
          <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-white/30">Loading...</div></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <TopHeader />
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Directory
            </button>

            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl mb-12">
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-heading mb-1">Edit Release</h1>
                  <p className="text-[var(--color-brand-muted)] text-sm">{form.album_name || "Untitled"}</p>
                </div>
                {form.cover_art_url && (
                  <img src={form.cover_art_url} alt={form.album_name} className="w-16 h-16 rounded-lg border border-white/10 object-cover" />
                )}
              </div>

              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Album / Single Name *</label>
                    <input className={inputClass} value={form.album_name} onChange={(e) => setForm({...form, album_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Artist Name</label>
                    <input className={inputClass} value={form.spotify_artist_name} onChange={(e) => setForm({...form, spotify_artist_name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Type</label>
                    <select className={inputClass} value={form.spotify_type} onChange={(e) => setForm({...form, spotify_type: e.target.value, media_type: [e.target.value === 'ALBUM' ? 'Music/Album' : 'Music/Single']})}>
                      <option value="ALBUM">Album</option>
                      <option value="Single">Single</option>
                      <option value="Album">Album (Alt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Release Date</label>
                    <input type="date" className={inputClass} value={form.release_date} onChange={(e) => setForm({...form, release_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Tracks</label>
                    <input type="number" className={inputClass} value={form.track_count} onChange={(e) => setForm({...form, track_count: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="Pending">Pending</option>
                      <option value="Updated">Updated</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Label</label>
                    <input className={inputClass} value={form.label} onChange={(e) => setForm({...form, label: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Cover Art URL</label>
                    <input className={inputClass} value={form.cover_art_url} onChange={(e) => setForm({...form, cover_art_url: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Streaming Links</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'spotify_album_url', label: 'Spotify' },
                      { key: 'apple_music_url', label: 'Apple Music' },
                      { key: 'youtube_music_url', label: 'YouTube Music' },
                      { key: 'deezer_url', label: 'Deezer' },
                      { key: 'tidal_url', label: 'Tidal' },
                      { key: 'soundcloud_url', label: 'SoundCloud' },
                      { key: 'amazon_music_url', label: 'Amazon Music' },
                      { key: 'bandcamp_url', label: 'Bandcamp' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">{field.label}</label>
                        <input className={inputClass} value={(form as any)[field.key]} onChange={(e) => setForm({...form, [field.key]: e.target.value})} placeholder="https://..." />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <button onClick={handleDelete}
                    className="px-4 h-10 rounded-lg border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <div className="flex gap-3">
                    <Link href="/dashboard/media" className="px-4 h-10 rounded-lg border border-white/10 text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center">
                      Cancel
                    </Link>
                    <button onClick={handleSave} disabled={saving || !form.album_name}
                      className="px-6 h-10 rounded-lg bg-[var(--color-brand-violet)] text-white text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-brand-violet)]/20"
                    >
                      <Save size={14} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
