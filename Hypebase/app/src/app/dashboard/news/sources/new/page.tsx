"use client"

import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { NewsSourceForm } from "@/components/forms/news-source-form"

export default function NewNewsSourcePage() {
  const router = useRouter()

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
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent">
                <h1 className="text-2xl font-bold font-heading mb-1">Register News Source</h1>
                <p className="text-[var(--color-brand-muted)] text-sm">Add a new media outlet or authoritative provider to the directory.</p>
              </div>

              <div className="p-8">
                <NewsSourceForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
