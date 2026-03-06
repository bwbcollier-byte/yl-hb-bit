"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { 
  HouseLine, BellRinging, ChatCircleDots, Note, 
  TreeStructure, CheckSquareOffset, IdentificationCard, 
  UserFocus, ShareNetwork, Article, UsersFour, 
  CalendarBlank, CaretDown, GearSix, MusicNote 
} from "@phosphor-icons/react"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavSection {
  label: string
  icon: any
  href?: string
  children: { href: string; label: string }[]
}

const DATABASE_SECTIONS: NavSection[] = [
  {
    label: "Contacts CRM",
    icon: IdentificationCard,
    href: "/dashboard/contacts",
    children: [
      { href: "/contacts", label: "Contacts" },
      { href: "/agencies", label: "Companies" },
    ],
  },
  {
    label: "Talent Profiles",
    icon: UserFocus,
    href: "/dashboard/talent",
    children: [
      { href: "/talent", label: "Profiles" },
      { href: "/talent/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Media",
    icon: MusicNote,
    href: "/dashboard/media",
    children: [
      { href: "/media", label: "Library" },
      { href: "/media/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Social Profiles",
    icon: ShareNetwork,
    href: "/dashboard/socials",
    children: [],
  },
  {
    label: "News & Media",
    icon: Article,
    href: "/dashboard/news",
    children: [
      { href: "/news/articles", label: "News Articles" },
      { href: "/news/sources", label: "News Sources" },
    ],
  },
  {
    label: "Clubs & Groups",
    icon: UsersFour,
    href: "/dashboard/clubs",
    children: [
      { href: "/clubs", label: "General" },
      { href: "/clubs/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Events",
    icon: CalendarBlank,
    href: "/dashboard/events",
    children: [
      { href: "/events", label: "Event List" },
      { href: "/venues", label: "Venues" },
      { href: "/events/calendar", label: "Calendar" },
    ],
  },
]

export function ObsidianSidebar() {
  const [userAvatar, setUserAvatar] = useState("https://i.pravatar.cc/150?img=11")
  const [userName, setUserName] = useState("User")
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("users").select("name_first, profile_image").eq("id", user.id).single()
        if (data) {
          if (data.profile_image) setUserAvatar(data.profile_image)
          if (data.name_first) setUserName(data.name_first)
        }
      }
    }
    fetchUser()

    const handleUpdate = (e: any) => {
      if (e.detail?.avatarUrl) setUserAvatar(e.detail.avatarUrl)
      if (e.detail?.name) setUserName(e.detail.name)
    }
    window.addEventListener("profileUpdated", handleUpdate)
    return () => window.removeEventListener("profileUpdated", handleUpdate)
  }, [])

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/sidebar w-[84px] hover:w-72 h-screen fixed left-0 top-0 bg-[var(--color-brand-surface-1)] border-r border-black/5 dark:border-white/5 flex flex-col py-6 transition-all duration-300 z-50 overflow-hidden shadow-2xl"
    >
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center h-8 whitespace-nowrap">
        <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold font-heading text-lg mr-4 flex-shrink-0 shadow-sm border border-black/10">
          HB
        </div>
        <h1 className="font-heading font-extrabold text-2xl tracking-tighter opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <Link href="/dashboard">
            Hypebase<span className="text-[var(--color-brand-violet)]">.</span>
          </Link>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="space-y-1 mb-8">
          <p className="px-7 text-[10px] font-bold text-[var(--color-brand-muted)] uppercase tracking-widest mb-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap h-4">ADMIN</p>
          <NavItem href="/dashboard" icon={HouseLine} label="Dashboard" />
          <NavItem href="/notifications" icon={BellRinging} label="Notifications" />
          <NavItem href="/chats" icon={ChatCircleDots} label="Chats" />
          <NavItem href="/notes" icon={Note} label="Notes" />
          <NavItem href="/workflows" icon={TreeStructure} label="Workflows" />
          <NavItem href="/tasks" icon={CheckSquareOffset} label="Tasks" />
        </div>

        <div className="space-y-1 mb-6">
          <p className="px-7 text-[10px] font-bold text-[var(--color-brand-muted)] uppercase tracking-widest mb-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap h-4">DATABASE</p>
          {DATABASE_SECTIONS.map((section) => (
            <NavDropdown key={section.label} section={section} sidebarHovered={isHovered} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 pb-2">
        <div className="mx-4 flex items-center gap-3 px-3 py-3 rounded-lg border border-black/5 dark:border-white/5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity whitespace-nowrap bg-[var(--color-brand-surface-2)] shadow-sm">
          <img src={userAvatar} alt="User" className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--color-brand-text)] leading-tight">{userName}</span>
            <span className="text-xs text-[var(--color-brand-muted)] mt-0.5">Administrator</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href))

  return (
    <Link href={href} className="flex px-4 items-center">
      <button className={`w-full flex items-center rounded-lg transition-all h-12 ${active ? "bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold" : "text-[#A0AEC0] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-brand-text)] font-semibold"}`}>
        <div className="w-[52px] flex items-center justify-center flex-shrink-0">
          <Icon size={22} weight="duotone" className={active ? "text-[var(--color-brand-violet)]" : ""} />
        </div>
        <span className="text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 text-left">{label}</span>
      </button>
    </Link>
  )
}

function NavDropdown({ section, sidebarHovered }: { section: NavSection; sidebarHovered: boolean }): React.ReactElement {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const Icon = section.icon
  const isFlatLink = section.children.length === 0

  const isSelfActive = section.href ? pathname === section.href : false;
  const isChildActive = section.children.some(
    (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
  ) || isSelfActive;
  const isOpenGlobal = open || isChildActive
  
  useEffect(() => {
    if (!sidebarHovered) {
      setOpen(false)
    }
  }, [sidebarHovered])

  const isOpen = sidebarHovered && (open || isChildActive)

  const activeClass = "bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold"
  const inactiveClass = "text-[#A0AEC0] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--color-brand-text)] font-semibold"
  const rowClass = `w-full flex items-center rounded-lg transition-all h-12 ${isChildActive ? activeClass : inactiveClass}`

  return (
    <div className="px-4">
      {isFlatLink ? (
        <Link href={section.href ?? "/socials"} className={rowClass}>
          <div className="w-[52px] flex items-center justify-center flex-shrink-0">
            <Icon size={22} weight="duotone" className={isChildActive ? "text-[var(--color-brand-violet)]" : ""} />
          </div>
          <span className="text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 text-left">
            {section.label}
          </span>
        </Link>
      ) : (
        <div className={rowClass}>
          <div className="flex flex-1 items-center h-full">
            <div 
              className="w-[52px] flex items-center justify-center flex-shrink-0 cursor-pointer hover:text-[var(--color-brand-violet)] transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!isOpen); }}
            >
              <Icon size={22} weight="duotone" className={isChildActive ? "text-[var(--color-brand-violet)]" : ""} />
            </div>
            <Link href={section.href ?? "#"} className="flex-1 h-full flex items-center">
              <span className="text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 text-left">
                {section.label}
              </span>
            </Link>
          </div>
          <div 
            className="px-3 h-full flex items-center justify-center cursor-pointer" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!isOpen); }}
          >
            <CaretDown
              size={16}
              weight="bold"
              className={`opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 text-[#A0AEC0] flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      )}

      {/* Sub-items */}
      {!isFlatLink && (
        <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
          {section.children.map((child) => {
            const childActive = pathname === child.href || pathname?.startsWith(child.href + "/")
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center h-10 pl-[52px] pr-4 text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-all rounded-lg ${
                  childActive ? "text-[var(--color-brand-violet)] font-bold" : "text-[#A0AEC0] hover:text-[var(--color-brand-text)] font-medium"
                }`}
              >
                <span className="w-4 mr-2 flex items-center justify-center">
                  <span className={`w-1 h-1 rounded-full ${childActive ? "bg-[var(--color-brand-violet)]" : "bg-[#A0AEC0]/40"}`} />
                </span>
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
