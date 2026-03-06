"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { ArrowLeft } from "lucide-react"
import { NewsArticleForm } from "@/components/forms/news-article-form"

export default function EditArticlePage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [articleData, setArticleData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const { data, error } = await supabase
          .from("news_articles")
          .select("*, source:news_sources(name)")
          .eq("id", id)
          .single()

        if (error) throw error
        setArticleData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
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
                  <h1 className="text-2xl font-bold font-heading mb-1">Edit Article</h1>
                  <p className="text-[var(--color-brand-muted)] text-sm">Update article content, attribution, and status.</p>
                </div>
                {articleData?.image_url && (
                   <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden shadow-xl">
                      <img src={articleData.image_url} alt={articleData.title} className="w-full h-full object-cover" />
                   </div>
                )}
              </div>

              <div className="p-8">
                {error ? (
                  <div className="p-8 text-center text-red-500 font-bold border border-red-500/20 rounded-xl bg-red-500/5">
                    {error}
                  </div>
                ) : (
                  <NewsArticleForm initialData={articleData} id={id as string} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
