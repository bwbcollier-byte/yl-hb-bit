"use client"
import { useState, useEffect, useRef } from "react"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { supabase } from "@/lib/supabase"
import { NativeDelete } from "@/components/ui/delete-button"
import { MaterialSwitch } from "@/components/ui/material-design-3-switch"
import {
  User, Upload, Trash2, Mail, Phone, Globe, Linkedin, Instagram,
  Facebook, MapPin, AlertTriangle, Link2, Building2, Briefcase, Flag
} from "lucide-react"

type Tab = "settings" | "credentials" | "deactivate"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("settings")
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile form state
  const defaultForm = {
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    company: "",
    phone: "",
    location: "",
    country: "",
    website: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    about: "",
    profileImage: "",
  }
  
  const [form, setForm] = useState(defaultForm)
  const [initialForm, setInitialForm] = useState(defaultForm)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
        
      if (data) {
        const meta = user.user_metadata || {}
        const fullName = meta.full_name || meta.name || ""
        const email = data.email || user.email || ""
        const phone = data.phone || meta.phone || ""
        const country = data.country || meta.country || ""
        const website = data.website || meta.website || ""
        const fallbackFirst = fullName ? fullName.split(' ')[0] : ""
        const fallbackLast = fullName ? fullName.split(' ').slice(1).join(' ') : ""
        const rawAvatar = data.profile_image || meta.avatar_url || meta.picture || ""

        const loadedForm = {
          firstName: data.name_first || fallbackFirst,
          lastName: data.name_last || fallbackLast,
          email: email,
          location: data.location || "",
          linkedin: data.social_linkedin || "",
          instagram: data.social_instagram || "",
          facebook: data.social_facebook || "",
          profileImage: rawAvatar,
          about: data.about || meta.about || "",
          jobTitle: data.job_title || meta.jobTitle || "",
          company: data.company || meta.company || "",
          phone: phone,
          country: country,
          website: website,
        }
        
        setForm(loadedForm)
        setInitialForm(loadedForm)
      } else {
        // Fallback to auth if no active profile exists in public.users yet
        const meta = user.user_metadata || {}
        const fullName = meta.full_name || meta.name || ""
        const fallbackFirst = fullName.split(' ')[0] || ""
        const fallbackLast = fullName.split(' ').slice(1).join(' ') || ""
        const rawAvatar = meta.avatar_url || meta.picture || ""

        const loadedForm = {
          ...defaultForm, 
          firstName: fallbackFirst,
          lastName: fallbackLast,
          email: user.email || "",
          profileImage: rawAvatar,
          about: meta.about || "",
          jobTitle: meta.jobTitle || "",
          company: meta.company || "",
          phone: meta.phone || "",
          country: meta.country || "",
          website: meta.website || "",
        }

        // AUTO-CREATE PROFILE RECORD IF MISSING
        try {
          await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            name_first: fallbackFirst,
            name_last: fallbackLast,
            name_full: fullName,
            profile_image: rawAvatar,
            updated_at: new Date().toISOString()
          })
          console.log("Auto-created missing user profile record.")
        } catch (e) {
          console.error("Failed to auto-create profile record:", e)
        }

        setForm(loadedForm)
        setInitialForm(loadedForm)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    
    try {
      const updates = {
        name_first: form.firstName,
        name_last: form.lastName,
        name_full: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        location: form.location,
        social_linkedin: form.linkedin,
        social_instagram: form.instagram,
        social_facebook: form.facebook,
        profile_image: form.profileImage,
        job_title: form.jobTitle,
        company: form.company,
        phone: form.phone,
        country: form.country,
        website: form.website,
        about: form.about,
        updated_at: new Date().toISOString()
      }

      const { error: upsertError } = await supabase.from("users").upsert({ id: userId, ...updates })
      if (upsertError) throw upsertError
      
      // Update missing fields in user metadata
      const { data: { user } } = await supabase.auth.getUser()
      const metadataUpdates = {
        jobTitle: form.jobTitle,
        company: form.company,
        phone: form.phone,
        country: form.country,
        website: form.website,
        about: form.about,
      }
      
      const { error: authError } = await supabase.auth.updateUser({ 
        email: user && user.email !== form.email ? form.email : undefined,
        data: metadataUpdates 
      })
      if (authError) throw authError
      
      
      setInitialForm(form)
      setSavedSuccess(true)
      
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { name: form.firstName, avatarUrl: form.profileImage } 
      }))
      
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (e: any) {
      console.error("Failed to save changes:", e)
      alert(`Failed to save changes: ${e.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return
    const file = e.target.files[0]
    
    // Immediate local preview
    const localUrl = URL.createObjectURL(file)
    setForm(prev => ({ ...prev, profileImage: localUrl }))
    
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
        
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
        
      setForm(prev => ({ ...prev, profileImage: publicUrl }))
      
      // Auto save the image URL to the user profile
      const { error: upsertError } = await supabase.from("users").upsert({ 
        id: userId, 
        email: form.email,
        profile_image: publicUrl 
      })
      if (upsertError) throw upsertError
      
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { avatarUrl: publicUrl }
      }))
    } catch (error: any) {
      console.error('Error uploading image: ', error)
      alert(`Error uploading image: ${error.message || 'Unknown error'}`)
    } finally {
      setUploadingImage(false)
      // Note: We keep the localUrl in state until publicUrl is ready or if it fails
    }
  }

  if (!loading && !userId) {
    return (
      <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
        <div className="hidden md:block w-[84px] shrink-0 relative z-50">
          <ObsidianSidebar />
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
          <TopHeader />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 rounded-full bg-[var(--color-brand-surface-1)] border border-white/5">
              <User size={48} className="text-[var(--color-brand-muted)]" />
            </div>
            <div className="max-w-md">
              <h2 className="font-heading text-2xl font-bold mb-2">Please Login</h2>
              <p className="text-[var(--color-brand-muted)] mb-6">
                You need to be logged in to access and manage your account settings.
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-6 py-2.5 rounded-lg bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white font-bold transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "settings", label: "Settings" },
    { id: "credentials", label: "Credentials" },
    { id: "deactivate", label: "Deactivate" },
  ]

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
        <TopHeader />

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-[1100px] mx-auto space-y-6">

            {/* Page heading */}
            <div>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-1">Settings</h2>
              <p className="text-[var(--color-brand-muted)] text-sm">Manage your account profile and preferences.</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--color-brand-violet)] text-white shadow-sm"
                      : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── TAB: Settings ── */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Avatar upload */}
                  <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-6 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-[var(--color-brand-surface-2)] border border-white/10 flex items-center justify-center overflow-hidden relative">
                      {form.profileImage ? (
                        <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-[var(--color-brand-muted)]" />
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-[var(--color-brand-violet)] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-brand-muted)] text-center">
                      Image must be 256×256 — Max 2MB. <br/>
                      <span className="opacity-60 italic">Note: Make sure an "avatars" bucket is created as public in Supabase.</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-[var(--color-brand-surface-2)] hover:bg-white/10 text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        <Upload size={14} /> {uploadingImage ? 'Uploading...' : 'Upload image'}
                      </button>
                      <NativeDelete
                        size="sm"
                        buttonText="Delete image"
                        confirmText="Confirm"
                        showIcon={true}
                        onConfirm={() => {}}
                        onDelete={() => set("profileImage", "")}
                        className="[&>button]:px-4 [&>button]:py-2 [&>button]:rounded-lg [&>button]:border [&>button]:border-white/10 [&>button]:bg-transparent hover:[&>button]:bg-white/5 [&>button]:text-sm [&>button]:font-semibold [&>button]:text-[var(--color-brand-muted)] [&>button]:transition-colors"
                      />
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className={`bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-6 space-y-5 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="First name" icon={<User size={15} />} />
                      <Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Last name" icon={<User size={15} />} />
                      <Field label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="Email" type="email" icon={<Mail size={15} />} />
                      <Field label="Job Title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} placeholder="Job title" icon={<Briefcase size={15} />} />
                      <Field label="Company" value={form.company} onChange={(v) => set("company", v)} placeholder="Company" icon={<Building2 size={15} />} />
                      <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="Phone" icon={<Phone size={15} />} />
                      <Field label="Location" value={form.location} onChange={(v) => set("location", v)} placeholder="City (not address)" icon={<MapPin size={15} />} />
                      <Field label="Country" value={form.country} onChange={(v) => set("country", v)} placeholder="Country" icon={<Flag size={15} />} />
                      <Field label="Website" value={form.website} onChange={(v) => set("website", v)} placeholder="Website" icon={<Globe size={15} />} />
                      <Field label="LinkedIn" value={form.linkedin} onChange={(v) => set("linkedin", v)} placeholder="LinkedIn URL" icon={<Linkedin size={15} />} />
                      <Field label="Instagram" value={form.instagram} onChange={(v) => set("instagram", v)} placeholder="@handle" icon={<Instagram size={15} />} />
                      <Field label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} placeholder="Facebook URL" icon={<Facebook size={15} />} />
                    </div>

                    {/* About */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-muted)]">About you</label>
                      <textarea
                        rows={4}
                        value={form.about}
                        onChange={(e) => set("about", e.target.value)}
                        placeholder="Tell people a bit about yourself..."
                        className="w-full bg-[var(--color-brand-surface-2)] border border-white/10 focus:border-[var(--color-brand-violet)]/50 outline-none rounded-lg px-4 py-3 text-sm text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)]/50 resize-none transition-colors"
                      />
                    </div>

                    {/* Preferences */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Email Notifications</p>
                        <p className="text-xs text-[var(--color-brand-muted)]">Receive updates on new messages and alerts.</p>
                      </div>
                      <div className="scale-75 origin-right">
                        <MaterialSwitch 
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                          variant="primary"
                          showIcons={true}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 items-center">
                      {savedSuccess && (
                        <span className="text-emerald-500 font-bold text-sm mr-auto animate-in fade-in duration-300">
                          Changes saved successfully!
                        </span>
                      )}
                      <button 
                        onClick={() => setForm(initialForm)}
                        className="px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold text-[var(--color-brand-muted)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-lg bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Preview Card */}
                <div className="lg:col-span-1">
                  <div className={`bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-6 sticky top-0 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-muted)] mb-4">Profile preview</p>
                    {/* Avatar */}
                    <div 
                      className="w-full aspect-square rounded-lg bg-[var(--color-brand-surface-2)] border border-white/10 flex items-center justify-center mb-4 overflow-hidden relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {form.profileImage ? (
                        <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      ) : (
                        <User size={64} className="text-[var(--color-brand-muted)]/40 group-hover:opacity-50 transition-opacity" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                          <Upload size={14} /> Upload
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-violet)]" />
                        <p className="font-heading font-bold text-lg">
                          {form.firstName || "First"} {form.lastName || "Last"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-brand-text)]">{form.company || "Company"}</p>
                      <p className="text-xs text-[var(--color-brand-muted)]">{form.jobTitle || "Update Job Title"}</p>
                    </div>

                    {/* Social link icons */}
                    <div className="flex items-center gap-3 mb-5">
                      {[Link2, Facebook, Linkedin, Instagram].map((Icon, i) => (
                        <button key={i} className="w-8 h-8 rounded-full bg-[var(--color-brand-surface-2)] border border-white/10 flex items-center justify-center text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>

                    {/* About */}
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-muted)] mb-2">About</p>
                      <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed">
                        {form.about || "Update your About you section — tell people more about yourself."}
                      </p>
                    </div>

                    {/* Contact icons */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                      {[Mail, Phone, MapPin].map((Icon, i) => (
                        <button key={i} className="text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Credentials ── */}
            {activeTab === "credentials" && (
              <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-8 max-w-2xl space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold mb-1">User Credentials</h3>
                  <p className="text-sm text-[var(--color-brand-muted)]">Update your login email and password.</p>
                </div>

                {/* Email row */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-muted)]">Email</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--color-brand-muted)]">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-[var(--color-brand-surface-2)] border border-white/10 focus:border-[var(--color-brand-violet)]/50 outline-none rounded-lg py-3 pl-9 pr-4 text-sm text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)]/50 transition-colors"
                      />
                    </div>
                    <button className="px-4 py-2.5 rounded-lg bg-[var(--color-brand-surface-2)] border border-white/10 hover:border-white/20 text-sm font-semibold whitespace-nowrap transition-colors">
                      Update Email
                    </button>
                  </div>
                </div>

                {/* Password row */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-muted)]">Password</label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="flex-1 bg-[var(--color-brand-surface-2)] border border-white/10 focus:border-[var(--color-brand-violet)]/50 outline-none rounded-lg py-3 px-4 text-sm text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)]/50 transition-colors"
                    />
                    <button className="px-4 py-2.5 rounded-lg bg-[var(--color-brand-surface-2)] border border-white/10 hover:border-white/20 text-sm font-semibold whitespace-nowrap transition-colors">
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Deactivate ── */}
            {activeTab === "deactivate" && (
              <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg p-8 max-w-2xl space-y-6">
                <div>
                  <h3 className="font-heading text-xl font-bold mb-1">Deactivate Account</h3>
                  <p className="text-sm text-[var(--color-brand-muted)]">Permanently deactivate your Hypebase account.</p>
                </div>

                {/* Warning box */}
                <div className="flex gap-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="shrink-0 mt-0.5">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-red-300 mb-1">Are you sure you want to deactivate your account?</p>
                    <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed">
                      As required per data privacy laws, we will deactivate your account as requested. Your data will be kept in our database for a period of 5 years. After that period, we will anonymize all your personal data.
                    </p>
                  </div>
                </div>

                {/* Confirmation checkbox */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border border-white/20 bg-transparent accent-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors">
                    I confirm my account deactivation
                  </span>
                </label>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold text-[var(--color-brand-muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <div className={!confirmed ? "opacity-30 pointer-events-none" : ""}>
                    <NativeDelete
                      size="md"
                      buttonText="Delete Account"
                      confirmText="Confirm Deletion"
                      onConfirm={() => {}}
                      onDelete={() => alert("Account deleted.")}
                      className="[&>button]:bg-red-500 [&>button]:hover:bg-red-600 [&>button]:text-white [&>button]:border-none shadow-sm h-[40px] [&>button]:h-full"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable field component
function Field({
  label, value, onChange, placeholder, type = "text", icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-muted)]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--color-brand-muted)]">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[var(--color-brand-surface-2)] border border-white/10 focus:border-[var(--color-brand-violet)]/50 outline-none rounded-lg py-3 ${icon ? "pl-9" : "pl-4"} pr-4 text-sm text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)]/50 transition-colors`}
        />
      </div>
    </div>
  )
}
