"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NativeDelete } from "@/components/ui/delete-button"
import { supabase } from "@/lib/supabase"
import { 
  Save, AlertCircle, ShieldCheck, 
  Type, AlignLeft, Globe, MapPin, 
  Trophy, Image as ImageIcon
} from "lucide-react"

interface ClubFormProps {
  initialData?: any
  id?: string
}

export function ClubForm({ initialData, id }: ClubFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "Sports Club",
    location: initialData?.location || "",
    logo: initialData?.logo || "",
    description: initialData?.description || "",
    website: initialData?.website || "",
    status: initialData?.status || "active"
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (id) {
        const { error } = await supabase
          .from("clubs_teams_groups")
          .update(formData)
          .eq("id", id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("clubs_teams_groups")
          .insert([formData])
        if (error) throw error
      }
      
      setSuccess(true)
      if (!id) {
        setTimeout(() => router.push("/clubs"), 2000)
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
      const { error } = await supabase.from("clubs_teams_groups").delete().eq("id", id)
      if (error) throw error
      router.push("/clubs")
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
          Club {id ? "updated" : "created"} successfully! { !id && "Redirecting..." }
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Club Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Type size={14} /> Club/Team Name
            </label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. London Lions RFC"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Trophy size={14} /> Club Type
            </label>
            <input 
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Rugby Union, E-Sports"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> Location
            </label>
            <input 
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. London, UK"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} /> Official Website
            </label>
            <input 
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2 col-span-full">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> Logo URL
            </label>
            <input 
              type="text"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
            <AlignLeft size={14} /> Description
          </label>
          <textarea 
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none resize-none"
            placeholder="Official club bio..."
          />
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
          {loading ? "SAVING..." : id ? "UPDATE CLUB" : "CREATE CLUB"}
        </button>
      </div>
    </form>
  )
}
