"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Search, Settings, ChevronDown, User, Monitor, LogOut,
  Check, X, Building2, BookOpen, ArrowUp, ArrowDown, HelpCircle,
  Plus, Home, Rss, ListTodo, MessageSquare, Bell
} from "lucide-react"
import { ExpandableTabs, TabItem } from "@/components/ui/expandable-tabs"
import { NotificationIcon } from "@/components/ui/animated-state-icons"
import { ContactUsModal } from "@/components/modals/contact-us-modal"
import { ThemeToggle } from "@/components/theme-toggle"

export function TopHeader() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [userAvatar, setUserAvatar] = useState("https://i.pravatar.cc/150?img=11")
  const pathname = usePathname()

  const getNavClass = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path + '/'));
    return isActive
      ? "px-5 py-2.5 bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold rounded-lg text-sm transition-colors border border-[var(--color-brand-violet)]/20 shadow-sm"
      : "px-5 py-2.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] font-semibold text-sm transition-colors rounded-lg hover:bg-black/5 dark:hover:bg-white/5";
  }

  const navTabs: TabItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "My Feed", href: "/feed", icon: Rss },
    { title: "Tasks", href: "/tasks", icon: ListTodo },
    { title: "Messages", href: "/chats", icon: MessageSquare }
  ];
  const currentTabIndex = navTabs.findIndex(t => t.href && (pathname === t.href || (t.href !== '/' && pathname?.startsWith(t.href + '/'))));

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("users").select("profile_image").eq("id", user.id).single()
        if (data?.profile_image) {
          setUserAvatar(data.profile_image)
        }
      }
    }
    fetchUser()
    const handleUpdate = (e: any) => {
      if (e.detail?.avatarUrl) setUserAvatar(e.detail.avatarUrl)
    }
    window.addEventListener("profileUpdated", handleUpdate)
    return () => window.removeEventListener("profileUpdated", handleUpdate)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false)
    }
    if (searchOpen) document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen])

  return (
    <>
      <div className="w-full h-20 bg-[var(--color-brand-surface-1)] border-b border-black/5 dark:border-white/5 flex items-center justify-between px-8 z-40 shrink-0 shadow-sm relative">
         <div className="flex flex-1" />

         <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center justify-center">
            <ExpandableTabs 
              tabs={navTabs} 
              activeColor="text-white" 
              defaultSelected={currentTabIndex !== -1 ? currentTabIndex : null} 
            />
         </div>

         <div className="flex items-center gap-3 flex-1 justify-end">
            <button 
              onClick={() => setSearchOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-[#1A1A1A] border border-white/5 hover:border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-white transition-all shadow-sm"
            >
               <Search size={22} />
            </button>
            
            <div className="relative" ref={notifRef}>
               <button 
                 onClick={() => setNotifOpen(!notifOpen)}
                 className={`w-12 h-12 flex items-center justify-center rounded-[24px] border transition-all shadow-sm ${notifOpen ? 'bg-white/10 border-white/10 text-white' : 'bg-[#1A1A1A] border-white/5 hover:border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-white'}`}
               >
                 <NotificationIcon size={24} color="currentColor" />
               </button>
               
               {notifOpen && (
                 <div className="absolute right-0 top-14 w-[380px] bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[var(--color-brand-surface-2)]/50">
                       <div className="flex items-center gap-3">
                          <span className="font-heading font-bold text-lg text-[var(--color-brand-text)]">Notifications</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-brand-violet)]/20 text-[var(--color-brand-violet)] border border-[var(--color-brand-violet)]/30 text-xs font-bold leading-tight shadow-sm shadow-[var(--color-brand-violet)]/10">3 new</span>
                       </div>
                       <button className="flex items-center gap-1.5 text-[var(--color-brand-violet)] hover:text-[var(--color-brand-violet)]/80 text-sm font-bold transition-colors">
                         <Check size={16} strokeWidth={2.5} /> Mark all as read
                       </button>
                    </div>
                    <div className="flex flex-col max-h-[400px] overflow-y-auto no-scrollbar">
                       <NotificationItem title="New Performance Review" desc="Your quarterly artist performance report is now available for review." unread />
                       <NotificationItem title="Contract Signed: Blue Lounge" desc="The venue contract for the upcoming event has been digitally signed." unread />
                       <NotificationItem title="Task Assigned: Tour Rider" desc="Marcus Aurelius assigned you to update the hospitality rider." unread />
                    </div>
                    <div className="p-3 border-t border-white/5 bg-[var(--color-brand-surface-2)]/50 text-center">
                       <button className="text-[var(--color-brand-violet)] hover:underline text-sm font-bold transition-colors">
                          See all notifications
                       </button>
                    </div>
                 </div>
               )}
            </div>

            <Link href="/settings">
              <button className="w-12 h-12 flex items-center justify-center rounded-[24px] bg-[#1A1A1A] border border-white/5 hover:border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-white transition-all shadow-sm hidden sm:flex">
                 <Settings size={22} />
              </button>
            </Link>

            <div className="relative ml-2" ref={profileRef}>
               <button 
                 onClick={() => setProfileOpen(!profileOpen)}
                 className="flex items-center gap-2 pl-1 pr-3 rounded-[24px] border border-transparent hover:border-white/10 hover:bg-white/5 transition-all outline-none"
               >
                  <div className="rounded-full p-[2px] bg-gradient-to-tr from-[#9600ff] via-[#ff00c1] to-[#00b8ff]">
                    <img src={userAvatar} alt="Profile" className="w-[38px] h-[38px] rounded-full object-cover border-[3px] border-[#161616]" />
                  </div>
                  <ChevronDown size={14} className={`text-[var(--color-brand-muted)] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
               </button>

               {profileOpen && (
                 <div className="absolute right-0 top-14 w-[220px] bg-[var(--color-brand-surface-1)] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 text-sm font-semibold">
                    <DropdownItem icon={User} label="My account" />
                    <DropdownItem icon={Bell} label="Notifications" />
                    <DropdownItem icon={HelpCircle} label="Contact Support" onClick={() => setContactOpen(true)} />
                    <DropdownItem icon={Settings} label="Settings" href="/settings" />
                    <div className="flex items-center justify-between px-4 py-2.5 mx-2 my-0.5 rounded-lg text-[var(--color-brand-text)] hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Monitor size={18} className="opacity-70" />
                        <span>Night Mode</span>
                      </div>
                      <ThemeToggle />
                    </div>
                    <div className="h-px bg-white/5 mx-3 my-2" />
                    <DropdownItem icon={LogOut} label="Log out" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" />
                 </div>
               )}
            </div>
         </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-24 px-4 sm:px-0 animate-in fade-in duration-200" onClick={() => setSearchOpen(false)}>
          <div className="bg-[var(--color-brand-surface-1)] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-[var(--color-brand-surface-2)]/30">
               <Search className="text-[var(--color-brand-muted)] ml-2" size={24} />
               <input 
                 type="text" 
                 placeholder="Search anything..." 
                 autoFocus 
                 className="flex-1 bg-transparent border-none outline-none text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)] text-xl font-medium" 
               />
               <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-[var(--color-brand-muted)] hover:text-white transition-colors">
                 <X size={20} />
               </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
               <div className="mb-6">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-brand-muted)] px-4 mb-3">Global Directory</h4>
                  <SearchItem icon={User} label="Find Talent" />
                  <SearchItem icon={Building2} label="Find Agencies" />
                  <SearchItem icon={BookOpen} label="Knowledge Base" />
               </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-[var(--color-brand-surface-2)]/80">
               <div className="flex items-center gap-2.5 text-xs text-[var(--color-brand-muted)] font-medium">
                  <kbd className="px-2 py-1.5 rounded-md bg-black border border-white/10 shadow-sm font-sans font-bold text-[11px]">Esc</kbd>
                  <span>To close</span>
               </div>
            </div>
          </div>
        </div>
      )}

      <ContactUsModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}

function DropdownItem({ icon: Icon, label, href, onClick, className = "" }: { icon: any, label: string, href?: string, onClick?: () => void, className?: string }) {
  const content = (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg text-[var(--color-brand-text)] hover:bg-white/10 transition-colors cursor-pointer ${className}`}>
      <Icon size={18} className="opacity-70" />
      <span>{label}</span>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function NotificationItem({ title, desc, unread }: { title: string, desc: string, unread?: boolean }) {
  return (
    <div className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer relative ${unread ? 'bg-white/[0.02]' : ''}`}>
      {unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand-violet)]" />}
      <h5 className="font-bold text-sm text-[var(--color-brand-text)] mb-1 leading-tight">{title}</h5>
      <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed pr-4">{desc}</p>
    </div>
  )
}

function SearchItem({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 mx-2 rounded-xl hover:bg-white/5 text-[var(--color-brand-text)] transition-colors cursor-pointer group">
       <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-surface-2)] border border-white/5 flex items-center justify-center text-[var(--color-brand-muted)] group-hover:text-white transition-colors shadow-sm">
         <Icon size={16} />
       </div>
       <span className="font-semibold text-[15px]">{label}</span>
    </div>
  )
}
