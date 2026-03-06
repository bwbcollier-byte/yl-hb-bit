"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ArrowLeft } from "lucide-react"
import { TalentForm } from "@/components/forms/talent-form"

export default function EditTalentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [talent, setTalent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTalent() {
      try {
        const { data, error } = await supabase
          .from("talent_profiles")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        setTalent(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTalent()
  }, [id])

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
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Directory
            </button>

            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl mb-12">
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-heading mb-1">Edit Talent Profile</h1>
                  <p className="text-[var(--color-brand-muted)] text-sm">Update professional details and management.</p>
                </div>
                {talent?.profile_image && (
                   <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden shadow-xl shrink-0">
                      <img src={talent.profile_image} alt={talent.name} className="w-full h-full object-cover" />
                   </div>
                )}
              </div>

              <div className="p-8">
                {error ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                ) : (
                  <TalentForm initialData={talent} id={id as string} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
