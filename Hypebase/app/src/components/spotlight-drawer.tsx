"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, Copy, AlertCircle, TrendingUp, Mail, ShieldCheck, Heart, Twitter, Instagram, Youtube, Facebook, Music2, Globe } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface TalentMock {
  id: string
  name: string
  category: string
  location: string
  verifiedAt: string
  momentumGrowth: number
  managerName: string
  managerEmail: string
  brandConflicts: string[]
  imageUrl?: string
  company?: string
  socials?: any[]
  workflow_logs?: any[]
  genres?: string[] | string
  popularity?: number
}

interface SpotlightDrawerProps {
  isOpen: boolean
  onClose: () => void
  talent: TalentMock | null
}

export function SpotlightDrawer({ isOpen, onClose, talent }: SpotlightDrawerProps) {
  const [copied, setCopied] = useState(false)
  const [socials, setSocials] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!talent?.id) return
    const fetchSocials = async () => {
      const { data } = await supabase.from('social_profiles').select('*').eq('talent_id', talent.id).neq('status', 'skipped_not_found')
      if (data) setSocials(data)
    }
    fetchSocials()
    
    // Check follow status
    const followed = localStorage.getItem(`follow_${talent.id}`) === 'true'
    setIsFollowing(followed)
  }, [talent])

  const toggleFollow = () => {
    const newState = !isFollowing
    setIsFollowing(newState)
    if (talent?.id) {
       localStorage.setItem(`follow_${talent.id}`, String(newState))
    }
  }

  const renderSocialIcon = (type: string) => {
    let Icon = Globe
    const t = type.toLowerCase()
    if (t.includes('instagram')) Icon = Instagram
    else if (t.includes('twitter') || t.includes('x')) Icon = Twitter
    else if (t.includes('youtube')) Icon = Youtube
    else if (t.includes('facebook')) Icon = Facebook
    else if (t.includes('spotify') || t.includes('apple') || t.includes('soundcloud') || t.includes('music')) Icon = Music2

    return (
       <div className="w-10 h-10 rounded-lg bg-transparent hover:bg-white/5 transition-colors flex shrink-0 items-center justify-center text-[var(--color-brand-violet)] cursor-pointer">
         <Icon size={22} />
       </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && talent && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "120%" }}
            animate={{ x: 0 }}
            exit={{ x: "120%" }}
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
               {talent.imageUrl ? (
                 <img src={talent.imageUrl} alt={talent.name} className="w-full aspect-square object-cover rounded-lg border border-white/5" />
               ) : (
                 <div className="w-full aspect-square bg-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                    <img src={`https://picsum.photos/seed/${talent.name.replace(/\s+/g, '')}drawer/800/800`} alt={talent.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
                 </div>
               )}
            </div>

            {/* Content Area */}
            <div className="px-8 pb-8 flex flex-col w-full text-white">
               
               {/* Identity */}
               <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-3xl">🇺🇸</span>
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight">{talent.name}</h2>
                  <ShieldCheck className="text-[var(--color-brand-violet)]" size={24} />
               </div>

               {/* Social Icons Bar */}
               <div className="flex items-center justify-center gap-2 mb-4 overflow-x-auto no-scrollbar">
                 {socials.length > 0 ? (
                   socials.map((social) => (
                      <a key={social.id} href={social.social_url} target="_blank" rel="noopener noreferrer" title={social.social_type}>
                        {renderSocialIcon(social.social_type)}
                      </a>
                   ))
                 ) : (
                   /* Fallback generic icons if none found */
                   Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg bg-transparent flex shrink-0 items-center justify-center text-[var(--color-brand-violet)] opacity-50">
                        <Globe size={22} />
                      </div>
                   ))
                 )}
               </div>

               {/* Genre / Type */}
               <div className="font-bold text-center text-lg mb-6 text-white/50">
                  {talent.category} | music
               </div>

               <div className="h-px w-full bg-white/5 mb-6" />

               {/* About Section */}
               <div className="mb-6">
                  <h3 className="font-extrabold text-white text-lg mb-2">About</h3>
                  <p className="text-white/60 leading-relaxed text-sm font-medium">
                    Apart from being one of the best-selling artists in music history, {talent.name} is one of the greatest rappers of his generation. He's effortlessly fast, fluid, dexterous, and unpredictable, capable of pulling off long-form narratives or withering asides. And thanks to his mentor Dr. Dre, he's had music to match with thick, muscular loops evoking the terror and paranoia conjured by his lyrics.
                  </p>
               </div>

               <div className="h-px w-full bg-white/5 mb-6" />

               {/* Team Buttons Grid */}
               <div className="grid grid-cols-4 gap-2 mb-8">
                  {['Manager', 'Agent', 'Label', 'Publisher'].map(role => (
                    <button key={role} className="flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-white/10 rounded-lg p-3 transition-colors">
                      <div className="w-10 h-10 rounded-full border-2 border-[var(--color-brand-violet)]/30 flex items-center justify-center bg-transparent text-[var(--color-brand-violet)]">
                        <CheckCircle size={18} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-white/80">{role}</span>
                    </button>
                  ))}
               </div>

               {/* Bottom CTA Row using the 'new button style'  */}
               <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                  <button className="flex-1 bg-[#09090b] border border-[var(--color-brand-violet)] text-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/10 font-bold py-3.5 rounded-lg flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(138,43,226,0.2)] active:scale-[0.98]">
                    Full Profile
                  </button>
                  <button 
                    onClick={toggleFollow}
                    className={`w-14 h-[52px] flex shrink-0 items-center justify-center rounded-lg transition-colors border ${isFollowing ? 'bg-[var(--color-brand-magenta)]/20 border-[var(--color-brand-magenta)] text-[var(--color-brand-magenta)]' : 'bg-[#09090b] hover:bg-[#1C1C1E] border-white/10 text-white/60'}`}
                  >
                    <Heart size={20} fill={isFollowing ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => handleCopy(talent.managerEmail)}
                    className="w-14 h-[52px] flex shrink-0 items-center justify-center rounded-lg bg-[#09090b] hover:bg-[#1C1C1E] border border-white/10 transition-colors text-white/60"
                    title="Copy Direct Email"
                  >
                    <Copy size={20} />
                  </button>
                  <button className="w-14 h-[52px] flex shrink-0 items-center justify-center rounded-lg bg-[#09090b] hover:bg-[#1C1C1E] border border-white/10 transition-colors text-white/60">
                    <Mail size={22} />
                  </button>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

