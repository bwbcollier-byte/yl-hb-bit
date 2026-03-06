"use client"

import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Users, FileText, Send, CheckCircle2, XCircle, Search, User } from "lucide-react"

export default function ProjectApplicationsPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'invitations'>('applications')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const table = activeTab === 'applications' ? 'project_applications' : 'project_invitations'
      const { data: records, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && records) {
        setData(records)
      }
      setLoading(false)
    }
    fetchData()
  }, [activeTab])

  const deleteRecord = async (id: string) => {
    if (!confirm("Remove this request?")) return
    const table = activeTab === 'applications' ? 'project_applications' : 'project_invitations'
    await supabase.from(table).delete().eq('id', id)
    setData(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)]">
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
            <div className="max-w-[1200px] mx-auto">
               <div className="px-2 mb-8">
                 <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                   <Users size={28} className="text-[var(--color-brand-violet)]" /> 
                   Talent Bookings & Casting
                 </h2>
                 <p className="text-[var(--color-brand-muted)]">Manage incoming applications and outbound talent invitations across all projects.</p>
               </div>

               <div className="flex items-center gap-4 mb-8 bg-white/5 w-max p-1 rounded-xl">
                 <button 
                  onClick={() => setActiveTab('applications')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'applications' ? 'bg-[var(--color-brand-violet)] text-white shadow-lg' : 'text-[var(--color-brand-muted)] hover:text-white'}`}
                 >
                   <FileText size={16} /> Applications
                 </button>
                 <button 
                  onClick={() => setActiveTab('invitations')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'invitations' ? 'bg-[var(--color-brand-violet)] text-white shadow-lg' : 'text-[var(--color-brand-muted)] hover:text-white'}`}
                 >
                   <Send size={16} /> Invitations Sent
                 </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                 {loading ? (
                   <div className="p-12 text-center text-white/50">Loading records...</div>
                 ) : data.length === 0 ? (
                   <div className="p-16 border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                       <User size={24} className="text-[var(--color-brand-muted)]" />
                     </div>
                     <h3 className="text-xl font-bold mb-1">No {activeTab}</h3>
                     <p className="text-[var(--color-brand-muted)] text-sm">There are currently no records to display.</p>
                   </div>
                 ) : (
                   data.map(item => (
                     <div key={item.id} className="bg-[var(--color-brand-surface-1)] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-[var(--color-brand-violet)]/40 transition-all shadow-lg">
                       <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                           <span className="bg-white/10 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
                             Project ID: {item.project_applied || item.project_invited || 'Unknown'}
                           </span>
                           <span className="text-[10px] text-[var(--color-brand-muted)]">
                             {new Date(item.created_at).toLocaleDateString()}
                           </span>
                         </div>
                         <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                           Target: {item.talent_applied || item.talent_invited || item.user_applied || 'Unknown Talent'}
                         </h4>
                         <p className="text-sm text-[var(--color-brand-muted)] line-clamp-2">
                           {item.details || 'No additional details provided with this request.'}
                         </p>
                       </div>
                       
                       <div className="flex items-center gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                         <button className="flex-1 md:flex-auto px-4 py-2 bg-white/5 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                           <CheckCircle2 size={16} /> Accept
                         </button>
                         <button onClick={() => deleteRecord(item.id)} className="flex-1 md:flex-auto px-4 py-2 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                           <XCircle size={16} /> Reject
                         </button>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
