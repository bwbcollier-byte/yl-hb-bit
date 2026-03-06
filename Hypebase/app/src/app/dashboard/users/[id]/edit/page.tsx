"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ArrowLeft, Save, User, Mail, Building2, Briefcase, ShieldCheck, AlertCircle } from "lucide-react"

export default function EditUserPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        setUser(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name_full: user.name_full,
          email: user.email,
          company: user.company,
          job_title: user.job_title,
          status: user.status,
          location: user.location,
          country: user.country,
          about: user.about,
          social_instagram: user.social_instagram,
          social_linkedin: user.social_linkedin,
          social_facebook: user.social_facebook,
          phone: user.phone,
          website: user.website,
          gender: user.gender
        })
        .eq("id", id)

      if (error) throw error
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-[var(--color-brand-obsidian)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-brand-violet)]"></div>
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
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>

            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent">
                <h1 className="text-2xl font-bold font-heading mb-1">Edit User Profile</h1>
                <p className="text-[var(--color-brand-muted)] text-sm">Update account details and permissions for this user.</p>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-[var(--color-brand-neon)]/10 border border-[var(--color-brand-neon)]/20 rounded-xl flex items-center gap-3 text-[var(--color-brand-neon)] text-sm animate-in fade-in slide-in-from-top-2">
                    <ShieldCheck size={18} />
                    Changes saved successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      <User size={14} /> Full Name
                    </label>
                    <input 
                      type="text"
                      value={user?.name_full || ""}
                      onChange={(e) => setUser({ ...user, name_full: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 focus:ring-1 focus:ring-[var(--color-brand-violet)]/20 transition-all text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} /> Email Address
                    </label>
                    <input 
                      type="email"
                      value={user?.email || ""}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 focus:ring-1 focus:ring-[var(--color-brand-violet)]/20 transition-all text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={14} /> Company
                    </label>
                    <input 
                      type="text"
                      value={user?.company || ""}
                      onChange={(e) => setUser({ ...user, company: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 focus:ring-1 focus:ring-[var(--color-brand-violet)]/20 transition-all text-sm"
                      placeholder="Tech Inc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      <Briefcase size={14} /> Job Title
                    </label>
                    <input 
                      type="text"
                      value={user?.job_title || ""}
                      onChange={(e) => setUser({ ...user, job_title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 focus:ring-1 focus:ring-[var(--color-brand-violet)]/20 transition-all text-sm"
                      placeholder="Product Designer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Location
                    </label>
                    <input 
                      type="text"
                      value={user?.location || ""}
                      onChange={(e) => setUser({ ...user, location: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="London, UK"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Country
                    </label>
                    <input 
                      type="text"
                      value={user?.country || ""}
                      onChange={(e) => setUser({ ...user, country: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="United Kingdom"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      About / Biography
                    </label>
                    <textarea 
                      rows={4}
                      value={user?.about || ""}
                      onChange={(e) => setUser({ ...user, about: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm resize-none"
                      placeholder="Tell us about the user..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Instagram URL
                    </label>
                    <input 
                      type="text"
                      value={user?.social_instagram || ""}
                      onChange={(e) => setUser({ ...user, social_instagram: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      LinkedIn URL
                    </label>
                    <input 
                      type="text"
                      value={user?.social_linkedin || ""}
                      onChange={(e) => setUser({ ...user, social_linkedin: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Facebook URL
                    </label>
                    <input 
                      type="text"
                      value={user?.social_facebook || ""}
                      onChange={(e) => setUser({ ...user, social_facebook: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Phone Number
                    </label>
                    <input 
                      type="text"
                      value={user?.phone || ""}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="+1 234 567 890"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Website
                    </label>
                    <input 
                      type="text"
                      value={user?.website || ""}
                      onChange={(e) => setUser({ ...user, website: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                      Gender
                    </label>
                    <select
                      value={user?.gender || ""}
                      onChange={(e) => setUser({ ...user, gender: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand-violet)]/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[var(--color-brand-surface-1)]">Select Gender</option>
                      <option value="male" className="bg-[var(--color-brand-surface-1)]">Male</option>
                      <option value="female" className="bg-[var(--color-brand-surface-1)]">Female</option>
                      <option value="non-binary" className="bg-[var(--color-brand-surface-1)]">Non-Binary</option>
                      <option value="prefer-not-to-say" className="bg-[var(--color-brand-surface-1)]">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
                       Status
                    </label>
                    <div className="flex gap-4">
                      {['active', 'inactive'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setUser({ ...user, status: s })}
                          className={`flex-1 py-3 px-4 rounded-xl border capitalize text-sm font-semibold transition-all ${
                            user.status === s 
                              ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)] text-[var(--color-brand-violet)]'
                              : 'bg-white/5 border-white/10 text-[var(--color-brand-muted)] hover:border-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold py-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)] active:scale-[0.98]"
                  >
                    <Save size={18} />
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
