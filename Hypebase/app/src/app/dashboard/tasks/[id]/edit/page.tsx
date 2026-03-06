"use client"

import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { TaskForm } from "@/components/forms/task-form"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import * as React from "react"

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(p => setResolvedParams(p))
  }, [params])

  useEffect(() => {
    async function loadData() {
      if (!resolvedParams?.id) return
      
      try {
        const { data: taskData, error: err } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", resolvedParams.id)
          .single()

        if (err) throw err
        setData(taskData)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams])

  if (!resolvedParams) return null

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
              Back to Board
            </button>

            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/50 to-transparent">
                <h1 className="text-2xl font-bold font-heading mb-1">Edit Task</h1>
                <p className="text-[var(--color-brand-muted)] text-sm">Update the progress, status, or details of this task.</p>
              </div>

              <div className="p-8">
                {loading ? (
                  <div className="flex items-center justify-center p-12 text-[var(--color-brand-muted)]">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                ) : error ? (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-center">
                    {error}
                  </div>
                ) : data ? (
                  <TaskForm initialData={data} id={resolvedParams.id} />
                ) : (
                  <div className="p-6 text-center text-[var(--color-brand-muted)]">
                    Task not found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
