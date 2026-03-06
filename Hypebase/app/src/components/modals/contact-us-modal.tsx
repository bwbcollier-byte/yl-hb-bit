"use client"

import { useState } from "react"
import { X, Mail, MessageSquare, Phone, ShieldCheck, AlertCircle } from "lucide-react"
import { SendIcon } from "@/components/ui/animated-state-icons"

interface ContactUsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactUsModal({ isOpen, onClose }: ContactUsModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Mocking submission
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[#FFFFFF] dark:bg-[#161616] border border-black/10 dark:border-white/5 rounded-lg w-full max-w-[480px] overflow-hidden shadow-2xl">
        
        <div className="p-6 pb-4 border-b border-black/10 dark:border-white/5 flex items-center justify-between">
           <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Contact support</h2>
           <button onClick={onClose} className="text-[#888] hover:text-black dark:hover:text-white transition-colors p-1"><X size={20} /></button>
        </div>

        {success ? (
          <div className="p-16 text-center animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-[var(--color-brand-neon)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--color-brand-neon)]/20 shadow-neon">
                <ShieldCheck size={40} className="text-[var(--color-brand-neon)]" />
             </div>
             <h3 className="text-2xl font-black font-heading mb-2">Message Sent</h3>
             <p className="text-[var(--color-brand-muted)] font-medium">We've received your request and will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div className="space-y-2">
               <label className="text-sm font-semibold text-zinc-700 dark:text-[var(--color-brand-muted)]">Email</label>
               <input 
                 required 
                 type="email" 
                 className="w-full bg-[#F5F6F8] dark:bg-[#1A1A1A] border border-transparent dark:border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#4F46E5] dark:focus:border-[var(--color-brand-violet)] outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 transition-colors" 
                 placeholder="john.doe@gmail.com" 
               />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-semibold text-zinc-700 dark:text-[var(--color-brand-muted)]">Message</label>
               <textarea 
                 required 
                 rows={4} 
                 className="w-full bg-[#F5F6F8] dark:bg-[#1A1A1A] border border-transparent dark:border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#4F46E5] dark:focus:border-[var(--color-brand-violet)] outline-none resize-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 transition-colors" 
                 placeholder="Write your message here" 
               />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 mt-8 border-t border-black/5 dark:border-white/5 pt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 font-bold text-sm rounded-lg text-zinc-700 dark:text-white bg-transparent border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                 Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2.5 bg-[#4F46E5] text-white font-bold text-sm rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                 <SendIcon size={16} className="mr-1" />
                 {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
