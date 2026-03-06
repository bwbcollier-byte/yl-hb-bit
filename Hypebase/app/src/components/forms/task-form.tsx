"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NativeDelete } from "@/components/ui/delete-button"
import { supabase } from "@/lib/supabase"
import { 
  Save, AlertCircle, ShieldCheck, 
  Type, AlignLeft, User, Activity, CheckCircle2,
  Users
} from "lucide-react"

interface TaskFormProps {
  initialData?: any
  id?: string
}

export function TaskForm({ initialData, id }: TaskFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    details: initialData?.details || "",
    status: initialData?.status || "pending",
    task_type: initialData?.task_type || "task",
    user_owner: initialData?.user_owner || "",
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
          .from("tasks")
          .update(formData)
          .eq("id", id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert([formData])
        if (error) throw error
      }
      
      setSuccess(true)
      if (!id) {
        setTimeout(() => router.push("/tasks"), 1000)
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
      const { error } = await supabase.from("tasks").delete().eq("id", id)
      if (error) throw error
      router.push("/tasks")
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
          Task {id ? "updated" : "created"} successfully! { !id && "Redirecting..." }
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-6 w-1 bg-[var(--color-brand-violet)] rounded-full" />
          <h2 className="text-lg font-bold">Task Properties</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-full">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Type size={14} /> Task Title
            </label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. Follow up with casting director"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={14} /> Status Column
            </label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none appearance-none"
            >
              <option value="pending">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Done</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} /> Task Type / Label
            </label>
            <input 
              type="text"
              value={formData.task_type}
              onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none"
              placeholder="e.g. urgent, design, backend"
            />
          </div>

          <div className="space-y-2 col-span-full">
            <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
              <Users size={14} /> Assignee (User ID)
            </label>
            <input 
              type="text"
              value={formData.user_owner}
              onChange={(e) => setFormData({ ...formData, user_owner: e.target.value })}
              className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none font-mono text-xs"
              placeholder="UUID or Email..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wider flex items-center gap-2">
            <AlignLeft size={14} /> Details / Brief
          </label>
          <textarea 
            rows={5}
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--color-brand-violet)]/50 transition-all text-sm outline-none resize-none"
            placeholder="Outline all actionable criteria for this task..."
          />
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
          className="flex-1 order-1 sm:order-2 bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98]"
        >
          <Save size={20} />
          {loading ? "SAVING..." : id ? "UPDATE TASK" : "CREATE TASK"}
        </button>
      </div>
    </form>
  )
}
