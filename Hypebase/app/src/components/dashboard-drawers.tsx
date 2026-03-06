"use client"
import { Calendar, MapPin, Building2, Briefcase, Mail, Phone, BadgeDollarSign, ShieldCheck, User } from "lucide-react"
import { DirectoryDrawerLayout } from "./directory-drawers"

interface BaseDrawerProps {
  isOpen: boolean
  onClose: () => void
  data: any
}

export function EventDrawer({ isOpen, onClose, data }: BaseDrawerProps) {
  if (!data) return null;
  const dateStr = data.spotify_date ? new Date(data.spotify_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "TBA"
  
  return (
    <DirectoryDrawerLayout 
      isOpen={isOpen} 
      onClose={onClose} 
      title={data.title || "Event Details"} 
      entityId={data.id}
      imageSrc={data.image}
      fallbackSrc={`https://picsum.photos/seed/${data.title?.replace(/\s+/g, '')}event/800/800`}
      subtitle={data.event_type || "Event"}
      isVerified={data.status === 'verified' || data.status === 'active'}
      onEdit={() => window.location.href = `/dashboard/events/${data.id}/edit`}
    >
       <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-white/50">
             <Calendar size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{dateStr}</span>
          </div>
          {data.location && (
            <div className="flex items-center gap-3 text-white/50">
               <MapPin size={18} className="text-[var(--color-brand-violet)]" />
               <span className="font-bold text-sm text-white/90">{data.location}</span>
            </div>
          )}
       </div>

       {data.about && (
         <div className="bg-transparent border border-white/5 rounded-lg p-5">
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About Event</h4>
            <p className="text-sm leading-relaxed text-white/80 font-medium">{data.about}</p>
         </div>
       )}
    </DirectoryDrawerLayout>
  )
}

export function UserDrawer({ isOpen, onClose, data }: BaseDrawerProps) {
  if (!data) return null;
  const name = data.name_full || data.name_first || data.email?.split('@')[0] || "User Details";
  
  return (
    <DirectoryDrawerLayout 
      isOpen={isOpen} 
      onClose={onClose} 
      title={name} 
      entityId={data.id}
      imageSrc={data.profile_image}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400`}
      subtitle={data.job_title || "Application User"}
      isVerified={data.status === 'active'}
      email={data.email}
      onEdit={() => window.location.href = `/dashboard/users/${data.id}/edit`}
    >
       <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-white/50">
             <Mail size={18} className="text-[var(--color-brand-neon)]" />
             <span className="font-bold text-sm text-white/90">{data.email}</span>
          </div>
          {data.phone && (
            <div className="flex items-center gap-3 text-white/50">
               <Phone size={18} className="text-[#00b8ff]" />
               <span className="font-bold text-sm text-white/90">{data.phone}</span>
            </div>
          )}
          <div className="h-px bg-white/5 my-1" />
          {data.company && (
            <div className="flex items-center gap-3 text-white/50">
               <Building2 size={18} className="text-[var(--color-brand-pink)]" />
               <span className="font-bold text-sm text-white/90">{data.company}</span>
            </div>
          )}
          {data.job_title && (
            <div className="flex items-center gap-3 text-white/50">
               <Briefcase size={18} className="text-[var(--color-brand-violet)]" />
               <span className="font-bold text-sm text-white/90">{data.job_title}</span>
            </div>
          )}
       </div>

       <div className="grid grid-cols-2 gap-4">
         <div className="bg-transparent border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-white/5 shadow-sm ${data.status === 'inactive' ? 'bg-zinc-800 text-white/60' : 'bg-[var(--color-brand-neon)]/10 text-[var(--color-brand-neon)] border-[var(--color-brand-neon)]/20'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'inactive' ? 'bg-zinc-400' : 'bg-[var(--color-brand-neon)]'}`} />
               {data.status === 'inactive' ? 'Inactive' : 'Active'}
            </span>
         </div>
         <div className="bg-transparent border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Joined</span>
            <span className="text-sm font-bold text-white/90">{data.created_at ? new Date(data.created_at).toLocaleDateString() : 'TBD'}</span>
         </div>
       </div>

       {data.bio && (
         <div className="bg-transparent border border-white/5 rounded-lg p-5">
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Bio / Notes</h4>
            <p className="text-sm leading-relaxed text-white/80 font-medium">{data.bio}</p>
         </div>
       )}
    </DirectoryDrawerLayout>
  )
}

export function DealDrawer({ isOpen, onClose, data }: BaseDrawerProps) {
  if (!data) return null;
  return (
    <DirectoryDrawerLayout 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${data.company} Deal`} 
      entityId={data.id || 'deal'}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.company || 'Deal')}&background=random&size=400`}
      subtitle="Business Deal"
    >
       <div className="bg-transparent border border-white/5 rounded-lg p-8 flex flex-col items-center text-center gap-2 relative overflow-hidden mb-6">
          <BadgeDollarSign size={48} className="text-[#06C149] mb-2 opacity-80" />
          <h3 className="text-4xl font-black tracking-tight text-white">{data.amount}</h3>
          <p className="text-sm font-black text-white/40 uppercase tracking-widest">Total Value</p>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#06C149]/5 rounded-full blur-2xl pointer-events-none" />
       </div>

       <div className="bg-transparent border border-white/5 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
             <div className="flex items-center gap-3 text-white/50">
                <Building2 size={16} /> <span className="text-sm font-black uppercase tracking-tighter">Partner</span>
             </div>
             <span className="font-bold text-white">{data.company}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
             <div className="flex items-center gap-3 text-white/50">
                <User size={16} /> <span className="text-sm font-black uppercase tracking-tighter">Signed By</span>
             </div>
             <span className="font-bold text-white">{data.signedBy}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
             <div className="flex items-center gap-3 text-white/50">
                <Calendar size={16} /> <span className="text-sm font-black uppercase tracking-tighter">Closing Date</span>
             </div>
             <span className="font-bold text-white">{new Date().toLocaleDateString()}</span>
          </div>
       </div>

       <div className="bg-transparent border border-white/5 rounded-lg p-6 mt-6">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Deal Summary</h4>
          <p className="text-sm leading-relaxed text-white/80 font-medium flex items-start gap-2">
            <div className="min-w-1.5 max-w-1.5 h-1.5 rounded-full bg-[#06C149] mt-1.5" />
            Standard enterprise contract signed with {data.company} including SLA Tier 1 and premium support package. Revenue recognized over 12 months.
          </p>
       </div>
    </DirectoryDrawerLayout>
  )
}

