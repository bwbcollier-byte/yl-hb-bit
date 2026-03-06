"use client"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Heart, Edit2, BadgeCheck, MapPin, CalendarDays, 
  Building2, Briefcase, Mail, Phone, Globe, ShieldCheck, 
  Newspaper, Link as LinkIcon, Users2, Copy 
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Base layout matching the new SpotlightDrawer design
export function DirectoryDrawerLayout({ 
  isOpen, 
  onClose, 
  imageSrc, 
  fallbackSrc, 
  title, 
  subtitle,
  isVerified = false,
  onEdit,
  entityId,
  email,
  children 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  imageSrc?: string,
  fallbackSrc: string,
  title: string, 
  subtitle?: string,
  isVerified?: boolean,
  onEdit?: () => void,
  entityId: string,
  email?: string,
  children: React.ReactNode 
}) {
  const [isLiked, setIsLiked] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('hypebase_liked_items')
      if (stored) {
        const likedIds = JSON.parse(stored)
        setIsLiked(likedIds.includes(entityId))
      }
    }
  }, [isOpen, entityId])

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    const stored = localStorage.getItem('hypebase_liked_items')
    let likedIds: string[] = stored ? JSON.parse(stored) : []
    
    if (likedIds.includes(entityId)) {
      likedIds = likedIds.filter(id => id !== entityId)
      setIsLiked(false)
    } else {
      likedIds.push(entityId)
      setIsLiked(true)
    }
    localStorage.setItem('hypebase_liked_items', JSON.stringify(likedIds))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    // Maybe add a toast here later
  }

  const handleMail = () => {
    if (email) {
      window.location.href = `mailto:${email}`
    } else {
      window.location.href = `mailto:?subject=Check out this profile: ${title}&body=${window.location.href}`
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "120%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "120%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 h-[calc(100%-32px)] w-[calc(100%-32px)] sm:w-[480px] bg-[#09090b] border border-white/10 rounded-lg z-50 overflow-y-auto overflow-x-hidden no-scrollbar shadow-2xl flex flex-col items-center"
          >
            {/* Absolute Controls */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                 <button 
                   onClick={onClose}
                   className="w-9 h-9 flex items-center justify-center bg-[#1C1C1E]/80 hover:bg-[#2C2C2E] rounded-lg text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg"
                 >
                   <X size={18} />
                 </button>
            </div>

            {/* Square Image Area within padding */}
            <div className="relative w-full p-4 shrink-0 pb-2">
               {imageSrc ? (
                 <img src={imageSrc} alt={title} className="w-full aspect-square object-cover rounded-lg border border-white/5 bg-[#1C1C1E]" />
               ) : (
                 <div className="w-full aspect-square bg-[#1C1C1E] rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                    <img src={fallbackSrc} alt={title} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
                 </div>
               )}
            </div>

            {/* Profile Info */}
            <div className="w-full px-6 flex flex-col items-center text-center mt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <h2 className="font-heading text-3xl font-extrabold text-white tracking-tight">{title}</h2>
                 {isVerified && <BadgeCheck fill="#FFFFFF" strokeWidth={2} className="text-black" size={24} />}
              </div>
              {subtitle && (
                <p className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-widest mb-4">{subtitle}</p>
              )}
            </div>

            <div className="w-full h-px bg-white/5 my-4" />

            <div className="w-full px-6 flex-1 flex flex-col gap-6 pb-24">
              {children}
            </div>

            {/* Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-2.5 z-20">
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className="flex-[2] h-14 rounded-xl border border-[var(--color-brand-violet)] bg-transparent text-[var(--color-brand-violet)] font-black text-base transition-all flex items-center justify-center shadow-[0_0_15px_rgba(138,43,226,0.15)] hover:bg-[var(--color-brand-violet)]/5"
                >
                  Full Profile
                </button>
              )}
              
              <button 
                onClick={toggleLike}
                className={`w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center transition-all ${isLiked ? 'bg-[#FF0080]/10 border-[#FF0080]/40 text-[#FF0080] shadow-[0_0_15px_rgba(255,0,128,0.2)]' : 'bg-[#1C1C1E] border-white/5 text-white/40 hover:text-white hover:border-white/20'}`}
              >
                <Heart size={22} className={isLiked ? "fill-[#FF0080]" : ""} />
              </button>

              <button 
                onClick={handleCopy}
                className="w-14 h-14 shrink-0 rounded-xl border border-white/5 bg-[#1C1C1E] text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                <Copy size={22} />
              </button>

              <button 
                onClick={handleMail}
                className="w-14 h-14 shrink-0 rounded-xl border border-white/5 bg-[#1C1C1E] text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                <Mail size={22} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ----------------------------------------------------------------------
// Specific Drawers
// ----------------------------------------------------------------------

export function EventDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  const dateStr = data.spotify_date ? new Date(data.spotify_date).toLocaleDateString() : "TBD"
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.title || "Event Details"}
      subtitle={data.event_type || "Event"}
      imageSrc={data.image}
      fallbackSrc={`https://picsum.photos/seed/${data.title?.replace(/\s+/g, '')}event/800/800`}
      isVerified={data.status === 'verified' || data.status === 'active'}
      onEdit={() => window.location.href = `/dashboard/events/${data.id}/edit`}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-white/50">
           <CalendarDays size={18} className="text-[var(--color-brand-violet)]" />
           <span className="font-bold text-sm text-white/90">{dateStr}</span>
        </div>
        {data.location && (
          <div className="flex items-center gap-3 text-white/50">
             <MapPin size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{data.location}</span>
          </div>
        )}
      </div>

      {(data.about || data.description) && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About Event</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.about || data.description}</p>
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}

export function ContactDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  const name = data.name_full || data.name_first || data.email?.split('@')[0] || "Unknown Contact"
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={name}
      subtitle={data.job_title || "Contact"}
      imageSrc={data.profile_image}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400`}
      isVerified={data.status === 'active'}
      email={data.email}
      onEdit={() => router.push(`/dashboard/contacts/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {data.email && (
          <div className="flex items-center gap-3 text-white/50">
             <Mail size={18} className="text-[var(--color-brand-neon)]" />
             <span className="font-bold text-sm text-white/90">{data.email}</span>
          </div>
        )}
        {data.phone && (
          <div className="flex items-center gap-3 text-white/50">
             <Phone size={18} className="text-[#00b8ff]" />
             <span className="font-bold text-sm text-white/90">{data.phone}</span>
          </div>
        )}
        {data.company && (
          <div className="h-px bg-white/5 my-1" />
        )}
        {data.company && (
          <div className="flex items-center gap-3 text-white/50">
             <Building2 size={18} className="text-[var(--color-brand-pink)]" />
             <span className="font-bold text-sm text-white/90">{data.company}</span>
          </div>
        )}
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

export function CompanyDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.name || "Company"}
      subtitle={data.type || "Organization"}
      imageSrc={data.logo_url || data.logo}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Company')}&background=random&size=400`}
      isVerified={data.status === 'active'}
      email={data.email}
      onEdit={() => router.push(`/dashboard/companies/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {data.location && (
          <div className="flex items-center gap-3 text-white/50">
             <MapPin size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{data.location}</span>
          </div>
        )}
        {data.website && (
          <div className="flex items-center gap-3 text-white/50">
             <Globe size={18} className="text-[var(--color-brand-neon)]" />
             <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-white/90 hover:underline hover:text-[var(--color-brand-violet)] transition-colors">
               {data.website}
             </a>
          </div>
        )}
      </div>

      {data.description && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.description}</p>
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}

export function ClubDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.name || "Club Details"}
      subtitle={data.type || "Club / Venue"}
      imageSrc={data.logo_url || data.logo || data.sdb_badge || data.sdb_logo}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Club')}&background=random&size=400`}
      isVerified={data.status === 'active'}
      onEdit={() => router.push(`/dashboard/clubs/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {data.location && (
          <div className="flex items-center gap-3 text-white/50">
             <MapPin size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{data.location}</span>
          </div>
        )}
        {data.capacity && (
          <div className="flex items-center gap-3 text-white/50">
             <Users2 size={18} className="text-[#00b8ff]" />
             <span className="font-bold text-sm text-white/90">Capacity: {data.capacity}</span>
          </div>
        )}
      </div>

      {data.about && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.about}</p>
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}

export function NewsArticleDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  const dateStr = data.published_at ? new Date(data.published_at).toLocaleDateString() : (data.created_at ? new Date(data.created_at).toLocaleDateString() : '')
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.title || "Article"}
      subtitle={data.source || "News"}
      imageSrc={data.image}
      fallbackSrc={`https://picsum.photos/seed/${data.title?.replace(/\s+/g, '')}news/800/800`}
      onEdit={() => router.push(`/dashboard/news/articles/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {dateStr && (
          <div className="flex items-center gap-3 text-white/50">
             <CalendarDays size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">Published: {dateStr}</span>
          </div>
        )}
        {data.url && (
          <div className="flex items-center gap-3 text-white/50">
             <LinkIcon size={18} className="text-[#00b8ff]" />
             <a href={data.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-white/90 hover:underline hover:text-[var(--color-brand-violet)] transition-colors truncate max-w-[280px]">
               {data.url}
             </a>
          </div>
        )}
      </div>

      {(data.summary || data.content) && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Summary</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.summary || data.content}</p>
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}

export function NewsSourceDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.name || "News Source"}
      subtitle={data.type || "Source"}
      imageSrc={data.logo || data.image}
      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Source')}&background=random&size=400`}
      isVerified={data.status === 'active'}
      onEdit={() => router.push(`/dashboard/news/sources/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {data.website && (
          <div className="flex items-center gap-3 text-white/50">
             <Globe size={18} className="text-[var(--color-brand-neon)]" />
             <a href={data.website.startsWith('http') ? data.website : `https://${data.website}`} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-white/90 hover:underline hover:text-[var(--color-brand-violet)] transition-colors">
               {data.website}
             </a>
          </div>
        )}
        {data.country && (
          <div className="flex items-center gap-3 text-white/50">
             <MapPin size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{data.country}</span>
          </div>
        )}
      </div>

      {data.description && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.description}</p>
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}

export function VenueDrawer({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const router = useRouter()
  if (!data) return null;
  
  return (
    <DirectoryDrawerLayout
      isOpen={isOpen}
      onClose={onClose}
      entityId={data.id}
      title={data.name || "Venue Details"}
      subtitle={data.primary_use || "Venue"}
      imageSrc={data.image}
      fallbackSrc={`https://picsum.photos/seed/${data.name?.replace(/\s+/g, '')}venue/800/800`}
      isVerified={data.status === 'active' || data.status === 'Verified'}
      onEdit={() => router.push(`/dashboard/venues/${data.id}/edit`)}
    >
      <div className="bg-transparent border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        {data.location && (
          <div className="flex items-center gap-3 text-white/50">
             <MapPin size={18} className="text-[var(--color-brand-violet)]" />
             <span className="font-bold text-sm text-white/90">{data.location}</span>
          </div>
        )}
        {data.capacity && (
          <div className="flex items-center gap-3 text-white/50">
             <Users2 size={18} className="text-[#00b8ff]" />
             <span className="font-bold text-sm text-white/90">Capacity: {new Intl.NumberFormat().format(data.capacity)}</span>
          </div>
        )}
        {data.home_club && (
          <div className="flex items-center gap-3 text-white/50">
             <Building2 size={18} className="text-[var(--color-brand-pink)]" />
             <span className="font-bold text-sm text-white/90">{data.home_club}</span>
          </div>
        )}
      </div>

      {data.details && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5">
           <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">About Venue</h4>
           <p className="text-sm leading-relaxed text-white/80 font-medium">{data.details}</p>
        </div>
      )}

      {(data.construction || data.spd_stadium_id) && (
        <div className="bg-transparent border border-white/5 rounded-lg p-5 grid grid-cols-2 gap-4">
           {data.construction && (
             <div>
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Construction</h4>
                <p className="text-xs font-bold text-white/70">{data.construction}</p>
             </div>
           )}
           {data.spd_stadium_id && (
             <div>
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Stadium ID</h4>
                <p className="text-xs font-bold text-white/70">{data.spd_stadium_id}</p>
             </div>
           )}
        </div>
      )}
    </DirectoryDrawerLayout>
  )
}
