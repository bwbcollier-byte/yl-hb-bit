"use client"

import { useState } from "react"
import { X, Plus, AlertCircle, ShieldCheck, ListTodo, Calendar, Flag, AlignLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DatePicker } from "@/components/ui/date-picker"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: () => void
  initialStatus?: string
}

export function CreateTaskModal({ isOpen, onClose, onTaskCreated, initialStatus = "todo" }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: initialStatus,
    priority: "medium",
    due_date: ""
  })
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        ...formData,
        due_date: formData.due_date || null
      }
      const { error } = await supabase.from("tasks").insert([payload])
      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        if (onTaskCreated) onTaskCreated()
        setFormData({ title: "", description: "", status: initialStatus, priority: "medium", due_date: "" })
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[#161616] border border-white/5 rounded-lg w-full max-w-[480px] overflow-hidden shadow-2xl">
        
        <div className="p-8 pb-6 bg-transparent flex items-start justify-between">
           <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Create New Task</h2>
              <p className="text-[var(--color-brand-muted)] text-[10px] font-bold uppercase tracking-widest">Assign missions and track progress</p>
           </div>
           <button onClick={onClose} className="text-[#888] hover:text-white transition-colors p-2 bg-white/5 rounded-md hover:bg-white/10"><X size={16} /></button>
        </div>

        {success ? (
          <div className="p-16 text-center animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-[var(--color-brand-neon)]/10 rounded-lg flex items-center justify-center mx-auto mb-6 border border-[var(--color-brand-neon)]/20 shadow-neon">
                <ShieldCheck size={40} className="text-[var(--color-brand-neon)]" />
             </div>
             <h3 className="text-2xl font-black font-heading mb-2">Task Created</h3>
             <p className="text-[var(--color-brand-muted)] font-medium">Your new task has been added to the board.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-xs">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
               <label className="text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-widest px-1">Task Title</label>
               <div className="relative">
                  <ListTodo className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={16} />
                  <input 
                    required 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-sm focus:border-[var(--color-brand-violet)]/50 outline-none placeholder:text-white/20 text-white transition-colors" 
                    placeholder="Briefly describe the objective..." 
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-widest px-1">Priority</label>
                  <div className="relative">
                     <Flag className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={14} />
                     <select 
                       value={formData.priority}
                       onChange={(e) => setFormData({...formData, priority: e.target.value})}
                       className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-sm focus:border-[var(--color-brand-violet)]/50 outline-none appearance-none cursor-pointer text-white transition-colors"
                     >
                        <option value="low" className="bg-[#1A1A1A]">Low Priority</option>
                        <option value="medium" className="bg-[#1A1A1A]">Medium Priority</option>
                        <option value="high" className="bg-[#1A1A1A]">High Priority</option>
                        <option value="urgent" className="bg-[#1A1A1A]">Urgent Action</option>
                     </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-widest px-1">Due Date</label>
                  <DatePicker 
                     value={formData.due_date}
                     onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-widest px-1">Additional Context</label>
               <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 text-[var(--color-brand-muted)]" size={16} />
                  <textarea 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-sm focus:border-[var(--color-brand-violet)]/50 outline-none resize-none placeholder:text-white/20 text-white transition-colors" 
                    placeholder="Optional details, links, or requirements..." 
                  />
               </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 font-semibold text-sm rounded-lg text-white hover:bg-white/5 border border-transparent transition-colors"
              >
                 Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-[var(--color-brand-violet)] text-black font-semibold text-sm rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent disabled:opacity-50"
              >
                 <Plus size={16} strokeWidth={2.5} />
                 {loading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
