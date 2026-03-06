"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NativeDelete } from "@/components/ui/delete-button"
import { supabase } from "@/lib/supabase"
import { 
  Save, AlertCircle, ShieldCheck, User,
  MapPin, Mail, Briefcase, Image as ImageIcon
} from "lucide-react"

interface TalentFormProps {
  initialData?: any
  id?: string
}

export function TalentForm({ initialData, id }: TalentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    act_type: initialData?.act_type || "Artist",
    location: initialData?.location || "",
    com_management: initialData?.com_management || "",
    com_email: initialData?.com_email || "",
    profile_image: initialData?.profile_image || initialData?.sp_image || "",
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
          .from("talent_profiles")
          .update(formData)
          .eq("id", id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("talent_profiles")
          .insert([formData])
        if (error) throw error
      }
      
      setSuccess(true)
      if (!id) {
        setTimeout(() => router.push("/talent"), 2000)
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
      const { error } = await supabase.from("talent_profiles").delete().eq("id", id)
      if (error) throw error
      router.push("/talent")
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
          Profile {id ? "updated" : "created"} successfully! { !id && "Redirecting..." }
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Profile Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Full Name
            </label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> Profile Image URL
            </label>
            <input 
              type="text"
              value={formData.profile_image}
              onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Act Type
            </label>
            <select
              value={formData.act_type}
              onChange={(e) => setFormData({ ...formData, act_type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none appearance-none cursor-pointer"
            >
              <option value="Artist" className="bg-[var(--color-brand-surface-1)]">Artist</option>
              <option value="Creator" className="bg-[var(--color-brand-surface-1)]">Creator</option>
              <option value="Athlete" className="bg-[var(--color-brand-surface-1)]">Athlete</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> Location
            </label>
            <input 
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Los Angeles, CA"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Management Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={14} /> Management Company
            </label>
            <input 
              type="text"
              value={formData.com_management}
              onChange={(e) => setFormData({ ...formData, com_management: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="Company Name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Mail size={14} /> Management Email
            </label>
            <input 
              type="email"
              value={formData.com_email}
              onChange={(e) => setFormData({ ...formData, com_email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="contact@company.com"
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
          className="flex-1 order-1 sm:order-2 border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold py-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)] active:scale-[0.98]"
        >
          <Save size={20} />
          {loading ? "SAVING..." : id ? "UPDATE PROFILE" : "CREATE PROFILE"}
        </button>
      </div>
    </form>
  )
}
