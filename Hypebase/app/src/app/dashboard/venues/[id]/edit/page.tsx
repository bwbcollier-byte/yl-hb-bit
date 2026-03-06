"use client"

import { VenueForm } from "@/components/forms/venue-form"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EditVenuePage() {
  const { id } = useParams()
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVenue() {
      if (!id) return
      const { data, error } = await supabase
        .from("venue_profiles")
        .select("*")
        .eq("id", id)
        .single()
      
      if (data) setVenue(data)
      setLoading(false)
    }
    fetchVenue()
  }, [id])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--color-brand-obsidian)]">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-violet)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            <Link 
              href="/venues" 
              className="inline-flex items-center gap-2 text-[var(--color-brand-muted)] hover:text-white transition-colors mb-8 group"
            >
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10">
                <ChevronLeft size={16} />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest">Back to Directory</span>
            </Link>

            <div className="mb-12">
              <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight mb-2">Edit {venue?.name || 'Venue'}</h1>
              <p className="text-[var(--color-brand-muted)] font-medium">Updating profile for {venue?.name}. Ensure all engineering stats are accurate.</p>
            </div>

            <div className="p-8 bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-brand-violet)] to-transparent opacity-50" />
              <VenueForm initialData={venue} id={id as string} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
