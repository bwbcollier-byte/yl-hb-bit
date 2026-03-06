"use client"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import { 
  CheckCircle2, Users2, BadgeDollarSign, MoreVertical, 
  Trash2, Edit2, ChevronLeft, ChevronRight, Plus, X, AlertCircle, ChevronUp, ChevronDown
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { CreateTaskModal } from "@/components/modals/create-task-modal"
import { ContactUsModal } from "@/components/modals/contact-us-modal"
import { EventDrawer, UserDrawer, DealDrawer } from "@/components/dashboard-drawers"
import { BudgetCard } from "@/components/ui/analytics-bento"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { NativeDelete } from "@/components/ui/delete-button"

export default function Dashboard() {
  const [userName, setUserName] = useState("John Doe")
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<{show: boolean, userId: string | null, userName: string}>({
    show: false,
    userId: null,
    userName: ""
  })
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [eventDrawer, setEventDrawer] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null})
  const [userDrawer, setUserDrawer] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null})
  const [dealDrawer, setDealDrawer] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null})

  // Revenue State
  type RevenueView = 'Weekly' | 'Monthly' | 'Annual';
  const [revenueView, setRevenueView] = useState<RevenueView>('Weekly')
  const [selectedWeek, setSelectedWeek] = useState('Last Week')

  // Application Users State
  const [selectAll, setSelectAll] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  // Dummy Revenue Data
  const revenueData: Record<string, number[]> = {
    'Last Week': [40, 70, 45, 90, 65, 80, 55],
    'This Week': [20, 30, 65, 45, 85, 95, 100],
    '2 Weeks Ago': [60, 50, 40, 30, 55, 75, 85]
  }
  const currentRevenueData = revenueData[selectedWeek] || revenueData['Last Week']

  useEffect(() => {
    async function fetchCounts() {
      const { count } = await supabase.from("users").select("*", { count: 'exact', head: true })
      setTotalUsers(count || 0)
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("name_first")
            .eq("id", user.id)
            .single()
          
          if (profile?.name_first) {
            setUserName(profile.name_first)
          }
        }

        // Fetch next 4 events
        const { data: eventData } = await supabase
          .from("event_profiles")
          .select("*")
          .order("spotify_date", { ascending: true })
          .limit(4)
        
        if (eventData) setEvents(eventData)

        // Fetch users for current page
        const from = (currentPage - 1) * 5
        const to = from + 4
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to)
        
        if (userData) setUsers(userData)

      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentPage])

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", id)
      
      if (error) throw error
      
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
    } catch (err: any) {
      console.error("Error toggling status:", err)
      // Fallback for mock if column doesn't exist yet
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUserIds(new Set(users.map(u => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleSelectUser = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
      setSelectAll(false)
    }
    setSelectedUserIds(newSelected)
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2">Good Morning, {userName}</h2>
                    <p className="text-[var(--color-brand-muted)]">Welcome to Talent Profiles Dashboard</p>
                  </div>
                  <button 
                    onClick={() => setTaskModalOpen(true)}
                    className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Let's create
                  </button>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1 */}
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                     <BudgetCard 
                       title="Total Profiles" 
                       amount="3,498" 
                       trendLabel="+ 20%" 
                       trend="up"
                       weekData={[
                         { day: "Sun", value: 100 }, { day: "Mon", value: 120 }, { day: "Tue", value: 110 },
                         { day: "Wed", value: 180 }, { day: "Thu", value: 160 }, { day: "Fri", value: 210 }, { day: "Sat", value: 240 }
                       ]}
                     />
                  </SpotlightCard>
                  
                  {/* Card 2 */}
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                     <BudgetCard 
                       title="Active Campaigns" 
                       amount="$132,844" 
                       trendLabel="+ 8%" 
                       trend="up"
                       weekData={[
                         { day: "Sun", value: 400 }, { day: "Mon", value: 420 }, { day: "Tue", value: 450 },
                         { day: "Wed", value: 460 }, { day: "Thu", value: 490 }, { day: "Fri", value: 520 }, { day: "Sat", value: 550 }
                       ]}
                     />
                  </SpotlightCard>

                  {/* Card 3 */}
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                     <BudgetCard 
                       title="Profile Views" 
                       amount="$25,848" 
                       trendLabel="- 12%" 
                       trend="down"
                       weekData={[
                         { day: "Sun", value: 300 }, { day: "Mon", value: 290 }, { day: "Tue", value: 320 },
                         { day: "Wed", value: 250 }, { day: "Thu", value: 180 }, { day: "Fri", value: 190 }, { day: "Sat", value: 150 }
                       ]}
                     />
                  </SpotlightCard>

                  {/* Card 4 */}
                  <SpotlightCard className="h-full rounded-lg border-none bg-transparent" spotlightColor="rgba(91, 82, 229, 0.15)">
                     <BudgetCard 
                       title="New Signups" 
                       amount="2,134" 
                       trendLabel="+ 42%" 
                       trend="up"
                       weekData={[
                         { day: "Sun", value: 50 }, { day: "Mon", value: 80 }, { day: "Tue", value: 120 },
                         { day: "Wed", value: 150 }, { day: "Thu", value: 210 }, { day: "Fri", value: 180 }, { day: "Sat", value: 300 }
                       ]}
                     />
                  </SpotlightCard>
                </div>

                {/* Middle Section (Charts & Tasks) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 bg-[#09090b] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 rounded-lg p-5 flex flex-col min-h-[350px]">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="font-bold text-lg">Profiles viewed</h3>
                        <p className="text-sm text-[var(--color-brand-muted)]">Weekly growth overview</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        {/* Period Select */}
                        <div className="relative group/select">
                          <select 
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-md px-3 py-1.5 pr-8 text-xs font-bold text-white uppercase tracking-wider focus:outline-none focus:border-[var(--color-brand-violet)] cursor-pointer"
                          >
                            {Object.keys(revenueData).map(week => (
                              <option key={week} value={week} className="bg-[#09090b] text-white py-1">{week}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover/select:text-white" />
                        </div>

                        {/* View Select */}
                        <div className="relative group/select hidden sm:block">
                          <select 
                            value={revenueView}
                            onChange={(e) => setRevenueView(e.target.value as RevenueView)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-md px-3 py-1.5 pr-8 text-xs font-bold text-white uppercase tracking-wider focus:outline-none focus:border-white/30 cursor-pointer"
                          >
                            <option value="Weekly" className="bg-[#09090b] text-white">Weekly</option>
                            <option value="Monthly" className="bg-[#09090b] text-white">Monthly</option>
                            <option value="Annual" className="bg-[#09090b] text-white">Annual</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover/select:text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-6 relative">
                      {/* Y-axis lines */}
                      <div className="absolute inset-x-0 bottom-14 border-t border-dashed border-white/5"></div>
                      <div className="absolute inset-x-0 bottom-24 border-t border-dashed border-white/5"></div>
                      <div className="absolute inset-x-0 bottom-34 border-t border-dashed border-white/5"></div>

                      <AnimatePresence mode="wait">
                        <div key={selectedWeek} className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-6 z-10 w-full">
                          {currentRevenueData.map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer relative z-10">
                          <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden flex flex-col justify-end min-h-[160px]">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: [0.16, 1, 0.3, 1] }}
                              className="w-full bg-gradient-to-t from-[var(--color-brand-violet)] via-[var(--color-brand-purple)] to-[var(--color-brand-pink)] rounded-t-lg relative group-hover:brightness-125 transition-all shadow-[0_0_20px_rgba(var(--color-brand-purple-rgb),0.2)]"
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black/90 text-[10px] font-bold px-2 py-1 rounded border border-white/10 text-white whitespace-nowrap shadow-xl transform translate-y-2 group-hover:translate-y-0">
                                  ${height}k
                                </div>
                              </motion.div>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--color-brand-muted)] uppercase tracking-widest group-hover:text-white transition-colors">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                            </span>
                          </div>
                        ))}
                        </div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Upcoming Tasks */}
                  <div className="lg:col-span-1 bg-[#09090b] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 rounded-lg p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg">Upcoming casting</h3>
                        <p className="text-sm text-[var(--color-brand-muted)]">Events coming up today</p>
                      </div>
                      
                      {/* Events Dropdown */}
                      <div className="relative group/events-menu">
                        <button className="text-[var(--color-brand-muted)] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/events-menu:opacity-100 group-hover/events-menu:visible transition-all z-50 py-1 overflow-hidden">
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">Create Event</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">All Events</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {events.length > 0 ? events.map((event, i) => {
                        const date = event.spotify_date ? new Date(event.spotify_date) : new Date()
                        const day = date.getDate()
                        const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
                        
                        return (
                          <div key={event.id} onClick={() => setEventDrawer({isOpen: true, data: event})} className="border border-white/5 rounded-lg p-4 flex gap-4 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] cursor-pointer group shadow-sm hover:shadow-xl active:scale-100">
                            <div className="flex flex-col items-center justify-center font-bold text-lg w-12 shrink-0 border-r border-black/5 dark:border-white/10 pr-4 group-hover:border-[var(--color-brand-violet)]/30 transition-colors">
                              <span className="text-[var(--color-brand-violet)] text-xl">{day}</span>
                              <span className="text-[10px] text-[var(--color-brand-violet)] font-bold tracking-widest">{month}</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-semibold text-sm mb-1 truncate transition-colors group-hover:text-[var(--color-brand-violet)]">{event.title}</h4>
                              <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed line-clamp-2 italic">
                                 {event.about || "No description available."}
                              </p>
                            </div>
                          </div>
                        )
                      }) : (
                        <p className="text-sm text-[var(--color-brand-muted)] italic py-4 text-center">No upcoming events found.</p>
                      )}
                    </div>
                  </div>

                  {/* Deals Signed (Sidebar) */}
                  <div className="lg:col-span-1 bg-[#09090b] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 rounded-lg p-5 flex flex-col lg:row-span-2 h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg">Recent bookings</h3>
                        <p className="text-sm text-[var(--color-brand-muted)]">Here comes the moneeeeeeey</p>
                      </div>
                      
                      {/* Deals Dropdown */}
                      <div className="relative group/deals-menu">
                        <button className="text-[var(--color-brand-muted)] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/deals-menu:opacity-100 group-hover/deals-menu:visible transition-all z-50 py-1 overflow-hidden">
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">Create Deal</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">All Deals</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto no-scrollbar pb-2">
                        {[
                          "Microsoft", "Tesla", "Starbucks", "Figma"
                        ].map((company, i) => (
                          <div key={i} onClick={() => setDealDrawer({isOpen: true, data: { company, amount: "13.000 €", signedBy: "Jane Doe" }})} className="border border-white/5 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.03] cursor-pointer group shadow-sm active:scale-100 flex items-center justify-between">
                            <div>
                               <h4 className="font-bold text-[15px] mb-1 group-hover:text-[var(--color-brand-violet)] transition-colors">{company}</h4>
                               <p className="text-xs text-[var(--color-brand-muted)]">
                                 13.000 € • Signed by Jane Doe
                               </p>
                            </div>
                            <div className="flex flex-col items-center justify-center font-bold shrink-0 pl-3">
                                <span className="text-[var(--color-brand-violet)] text-base leading-none">23</span>
                                <span className="text-[9px] text-[var(--color-brand-violet)] font-bold tracking-widest leading-tight">FEB</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Contacts Table (Bottom Left - spans 3 cols) */}
                  <div className="lg:col-span-3 bg-[#09090b] shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 rounded-lg p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg">Talent Roster</h3>
                        <p className="text-sm text-[var(--color-brand-muted)]">These are the latest people to sign up</p>
                      </div>
                      
                      {/* Users Dropdown */}
                      <div className="relative group/users-menu">
                        <button className="text-[var(--color-brand-muted)] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/users-menu:opacity-100 group-hover/users-menu:visible transition-all z-50 py-1 overflow-hidden">
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">Create User</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-violet)]/10 hover:text-[var(--color-brand-violet)] transition-colors">All Users</button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto rounded-lg border border-white/5">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#1a1a1c] text-white/50 text-[11px] uppercase tracking-wider border-b border-white/5">
                          <tr>
                            <th className="py-4 px-4 font-bold w-12 text-center border-r border-white/5">
                              <input 
                                type="checkbox" 
                                checked={selectAll}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-3.5 h-3.5 rounded-sm border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                              />
                            </th>
                            <th className="py-3 px-4 font-medium">Customer</th>
                            <th className="py-3 px-4 font-medium">Company</th>
                            <th className="py-3 px-4 font-medium">Title</th>
                            <th className="py-3 px-4 font-medium">Status</th>
                            <th className="py-3 px-4 font-medium">Created at</th>
                            <th className="py-3 px-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                          {users.length > 0 ? users.map((u, i) => {
                            const isSelected = selectedUserIds.has(u.id);
                            return (
                             <tr key={u.id} className={`transition-colors cursor-pointer group border-b border-white/5 last:border-0 ${isSelected ? 'bg-[var(--color-brand-violet)]/5' : 'bg-[#09090b] hover:bg-white/5'}`} onClick={() => setUserDrawer({isOpen: true, data: u})}>
                               <td className={`py-4 px-4 text-center border-r border-white/5 ${isSelected ? 'bg-[var(--color-brand-violet)]/10' : ''}`} onClick={(e) => e.stopPropagation()}>
                                 <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(e) => handleSelectUser(u.id, e.target.checked)}
                                    className="w-3.5 h-3.5 rounded-sm border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                                 />
                               </td>
                               <td className="py-4 px-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                                     <img src={u.profile_image || `https://i.pravatar.cc/150?u=${u.id}`} alt={u.name_full || u.email} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                     <p className="font-bold text-white text-[13px]">{u.name_full || u.email.split('@')[0]}</p>
                                     <p className="text-[11px] text-[var(--color-brand-muted)]">{u.email}</p>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px]">{u.company || "N/A"}</td>
                               <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px]">{u.job_title || "N/A"}</td>
                               <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1c] border border-white/5 text-[11px] font-bold text-white transition-all active:scale-95 select-none cursor-pointer hover:border-white/20"
                                   onClick={() => toggleUserStatus(u.id, u.status || 'active')}
                                 >
                                   <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${u.status === 'inactive' ? 'bg-red-500 text-red-500' : 'bg-[#00FA9A] text-[#00FA9A]'}`}></div>
                                   {u.status === 'inactive' ? 'Inactive' : 'Active'}
                                 </div>
                               </td>
                               <td className="py-4 px-4 text-[var(--color-brand-muted)] text-[13px]">
                                 {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                               </td>
                               <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div onClick={(e) => e.stopPropagation()}>
                                     <NativeDelete
                                       size="sm"
                                       buttonText="Del"
                                       confirmText="Confirm"
                                       onConfirm={() => {}}
                                       onDelete={async () => {
                                         try {
                                           const { error } = await supabase.from("users").delete().eq("id", u.id);
                                           if (error) throw error;
                                           setUsers(prev => prev.filter(user => user.id !== u.id));
                                         } catch (err: any) {
                                           alert(`Error deleting user: ${err.message}`)
                                         }
                                       }}
                                     />
                                   </div>
                                   <Link href={`/dashboard/users/${u.id}/edit`}>
                                     <button className="px-3 h-8 text-[11px] font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                                       Edit
                                     </button>
                                   </Link>
                                 </div>
                               </td>
                             </tr>
                            )
                           }) : (
                            <tr>
                              <td colSpan={7} className="py-10 text-center text-[var(--color-brand-muted)] italic">
                                No users found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      
                      {/* Table Pagination */}
                      <div className="flex justify-between items-center p-4 border-t border-white/10 bg-[var(--color-brand-surface-1)]">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-[var(--color-brand-muted)] font-semibold">
                          Page {currentPage} of {Math.max(1, Math.ceil(totalUsers / 5))}
                        </span>
                        <button 
                          disabled={currentPage >= Math.ceil(totalUsers / 5)}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-lg hover:bg-white/5 text-[var(--color-brand-muted)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

            </div>
         </div>
      </div>

      {/* Modals and Drawers */}

      <CreateTaskModal 
        isOpen={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        onTaskCreated={() => {}} // Could refresh tasks if shown on dashboard
      />

      <ContactUsModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />

      <EventDrawer isOpen={eventDrawer.isOpen} onClose={() => setEventDrawer({isOpen: false, data: null})} data={eventDrawer.data} />
      <UserDrawer isOpen={userDrawer.isOpen} onClose={() => setUserDrawer({isOpen: false, data: null})} data={userDrawer.data} />
      <DealDrawer isOpen={dealDrawer.isOpen} onClose={() => setDealDrawer({isOpen: false, data: null})} data={dealDrawer.data} />
    </div>
  )
}
