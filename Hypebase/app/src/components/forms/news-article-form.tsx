"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NativeDelete } from "@/components/ui/delete-button"
import { supabase } from "@/lib/supabase"
import { 
  Save, Newspaper, Globe, Calendar, 
  AlignLeft, ShieldCheck, AlertCircle,
  Image as ImageIcon, User, Link as LinkIcon
} from "lucide-react"

interface NewsArticleFormProps {
  initialData?: any
  id?: string
}

export function NewsArticleForm({ initialData, id }: NewsArticleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content_url: initialData?.content_url || "",
    published_at: initialData?.published_at || new Date().toISOString().split('T')[0],
    source_id: initialData?.source_id || "",
    image_url: initialData?.image_url || "",
    status: initialData?.status || "published",
    author: initialData?.author || "",
    category: initialData?.category || "General"
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadSources() {
      const { data } = await supabase.from("news_sources").select("id, name").order("name")
      if (data) setSources(data)
    }
    loadSources()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const dataToSave = { ...formData }
      if (dataToSave.source_id === "") (dataToSave as any).source_id = null

      if (id) {
        const { error } = await supabase
          .from("news_articles")
          .update(dataToSave)
          .eq("id", id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("news_articles")
          .insert([dataToSave])
        if (error) throw error
      }
      
      setSuccess(true)
      if (!id) {
        setTimeout(() => router.push("/news/articles"), 2000)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  
  const handleDelete = async () => {
    if (!id) return
    setLoading(true)
    try {
      const { error } = await supabase.from("news_sources").delete().eq("id", id)
      if (error) throw error
      router.push("/news/articles")
    } catch (err: any) {
      setError("Failed to delete: " + err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-10 animate-in fade-in duration-500">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-[var(--color-brand-neon)]/10 border border-[var(--color-brand-neon)]/20 rounded-xl flex items-center gap-3 text-[var(--color-brand-neon)] text-sm">
          <ShieldCheck size={18} />
          Article {id ? "updated" : "published"} successfully! { !id && "Redirecting..." }
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Article Content</h2>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
            <Newspaper size={14} /> Article Title
          </label>
          <input 
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            placeholder="Headline of the article"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <LinkIcon size={14} /> Content URL / Source Link
            </label>
            <input 
              type="url"
              required
              value={formData.content_url}
              onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> Featured Image URL
            </label>
            <input 
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Metadata & Attribution</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} /> News Source
            </label>
            <select
              value={formData.source_id}
              onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-[var(--color-brand-surface-1)]">Select Source</option>
              {sources.map(s => (
                <option key={s.id} value={s.id} className="bg-[var(--color-brand-surface-1)]">{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Author/Writer
            </label>
            <input 
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="Editorial Team"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} /> Publication Date
            </label>
            <input 
              type="date"
              value={formData.published_at}
              onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} /> Category
            </label>
            <input 
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Press Release"
            />
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-white/10 flex flex-col sm:flex-row gap-4">
        {id && (
          <NativeDelete 
            onConfirm={() => {}}
            onDelete={handleDelete}
            size="lg"
            className="w-full sm:w-auto flex-shrink-0 order-2 sm:order-1"
          />
        )}
        <button 
          type="submit"
          disabled={loading}
          className="flex-1 order-1 sm:order-2 bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-black font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl active:scale-[0.98]"
        >
          <Save size={20} />
          {loading ? "PUBLISHING..." : id ? "UPDATE ARTICLE" : "PUBLISH ARTICLE"}
        </button>
      </div>
    </form>
  )
}
