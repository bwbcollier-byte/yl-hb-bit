"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NativeDelete } from "@/components/ui/delete-button"
import { supabase } from "@/lib/supabase"
import { 
  Save, MapPin, AlertCircle, 
  ShieldCheck, Info, Image as ImageIcon,
  Type, AlignLeft, CheckCircle2, Building2,
  Users2, Globe, Hash, Layout
} from "lucide-react"

interface VenueFormProps {
  initialData?: any
  id?: string
}

export function VenueForm({ initialData, id }: VenueFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    details: initialData?.details || "",
    status: initialData?.status || "Active",
    image: initialData?.image || "",
    location: initialData?.location || "",
    home_club: initialData?.home_club || "",
    spd_stadium_id: initialData?.spd_stadium_id || "",
    primary_use: initialData?.primary_use || "",
    street: initialData?.street || "",
    postcode: initialData?.postcode || "",
    city: initialData?.city || "",
    soc_website: initialData?.soc_website || "",
    construction: initialData?.construction || "",
    capacity: initialData?.capacity || 0,
    standing: initialData?.standing || 0,
    seats: initialData?.seats || 0,
    categories: initialData?.categories || [],
    attachments: initialData?.attachments || []
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
        // Update
        const { error } = await supabase
          .from("venue_profiles")
          .update(formData)
          .eq("id", id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from("venue_profiles")
          .insert([formData])
        if (error) throw error
      }
      
      setSuccess(true)
      if (!id) {
        setTimeout(() => router.push("/venues"), 2000)
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
      const { error } = await supabase.from("venue_profiles").delete().eq("id", id)
      if (error) throw error
      router.push("/venues")
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
          Venue {id ? "updated" : "created"} successfully! { !id && "Redirecting..." }
        </div>
      )}

      {/* Basic Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Venue Identity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Type size={14} /> Venue Name
            </label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Wembley Stadium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> Main Image URL
            </label>
            <input 
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Layout size={14} /> Primary Use
            </label>
            <input 
              type="text"
              value={formData.primary_use}
              onChange={(e) => setFormData({ ...formData, primary_use: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Football / Multi-purpose"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={14} /> Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none appearance-none cursor-pointer"
            >
              <option value="Active" className="bg-[var(--color-brand-surface-1)]">Active</option>
              <option value="Inactive" className="bg-[var(--color-brand-surface-1)]">Inactive / Closed</option>
              <option value="In Construction" className="bg-[var(--color-brand-surface-1)]">In Construction</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
            <AlignLeft size={14} /> About Venue
          </label>
          <textarea 
            rows={4}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none resize-none"
            placeholder="Detailed description of the venue..."
          />
        </div>
      </div>

      {/* Location & Contact */}
      <div className="space-y-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Location & Online</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> Street
            </label>
            <input 
              type="text"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="123 Venue St"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Building2 size={14} /> City
            </label>
            <input 
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Hash size={14} /> Postcode
            </label>
            <input 
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} /> Website / Social URL
            </label>
            <input 
              type="text"
              value={formData.soc_website}
              onChange={(e) => setFormData({ ...formData, soc_website: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Stats & Identifiers */}
      <div className="space-y-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Statistics & Engineering</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Users2 size={14} /> Total Capacity
            </label>
            <input 
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Standing
            </label>
            <input 
              type="number"
              value={formData.standing}
              onChange={(e) => setFormData({ ...formData, standing: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Seats
            </label>
            <input 
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
               Construction / Year
            </label>
            <input 
              type="text"
              value={formData.construction}
              onChange={(e) => setFormData({ ...formData, construction: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. 1923"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Building2 size={14} /> Home Club
            </label>
            <input 
              type="text"
              value={formData.home_club}
              onChange={(e) => setFormData({ ...formData, home_club: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Arsenal FC"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Hash size={14} /> Stadium ID
            </label>
            <input 
              type="text"
              value={formData.spd_stadium_id}
              onChange={(e) => setFormData({ ...formData, spd_stadium_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="External ID"
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
          className="flex-1 order-1 sm:order-2 bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-black font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl shadow-[var(--color-brand-violet)]/20 active:scale-[0.98]"
        >
          <Save size={20} />
          {loading ? "SAVING..." : id ? "UPDATE VENUE" : "CREATE VENUE"}
        </button>
      </div>
    </form>
  )
}
