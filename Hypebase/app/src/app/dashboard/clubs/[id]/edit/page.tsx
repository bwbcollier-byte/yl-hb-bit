"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ArrowLeft } from "lucide-react"
import { ClubForm } from "@/components/forms/club-form"

export default function EditClubPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clubData, setClubData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClub() {
      try {
        const { data, error } = await supabase
          .from("clubs_teams_groups")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        setClubData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchClub()
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
          <div className="max-w-4xl mx-auto pb-20">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white mb-8 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-heading mb-1">Edit Club</h1>
                  <p className="text-[var(--color-brand-muted)] text-sm">Update club details, location, and official branding.</p>
                </div>
                {clubData?.logo && (
                   <div className="w-16 h-16 rounded-xl border border-white/10 p-2 overflow-hidden shadow-xl bg-white/5">
                      <img src={clubData.logo} alt={clubData.name} className="w-full h-full object-contain" />
                   </div>
                )}
              </div>

              <div className="p-8">
                {error ? (
                  <div className="p-8 text-center text-red-500 font-bold border border-red-500/20 rounded-xl bg-red-500/5">
                    {error}
                  </div>
                ) : (
                  <ClubForm initialData={clubData} id={id as string} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
