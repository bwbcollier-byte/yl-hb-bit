"use client"
import { useState, useEffect } from "react"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import ThreeDFolders, { defaultPortfolioData, PortfolioCategory } from "@/components/ui/3d-folder"
import { ServerManagementTable, Server } from "@/components/ui/server-management-table"
import { getWorkflows, updateWorkflowStatus, updateWorkflowDetails, triggerWorkflow, getWorkflowRunStatus, WorkflowRecord } from "./actions"
import { BudgetCard } from "@/components/ui/analytics-bento"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { 
  Search, Plus, Filter, Heart, LayoutGrid, SlidersHorizontal, ArrowDown, ArrowUp, TableProperties, CheckCircle2, Users2, BadgeDollarSign
} from "lucide-react"

export default function WorkflowsPage() {
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [sortAsc, setSortAsc] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set())
  const [activityLogs, setActivityLogs] = useState<Record<string, string[]>>({})
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [sortBy, setSortBy] = useState<"name" | "status" | "health">("name")
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    async function loadWorkflows() {
      const data = await getWorkflows()
      setWorkflows(data)
      setLoading(false)
    }
    loadWorkflows()
  }, [])

  const handleStatusChange = async (serverId: string, newStatus: Server["status"]) => {
    const success = await updateWorkflowStatus(serverId, newStatus)
    if (success) {
      setWorkflows(prev => prev.map(w => w.id === serverId ? { ...w, status: newStatus } : w))
    }
  }

  const handleEdit = async (updatedServer: Server) => {
    const updates: Partial<WorkflowRecord> = {
      name: updatedServer.serviceName,
      location: updatedServer.serviceLocation,
      endpoint_url: updatedServer.ip,
      category: updatedServer.category || "DATABASE"
    }
    
    const success = await updateWorkflowDetails(updatedServer.id, updates)
    if (success) {
      setWorkflows(prev => prev.map(w => w.id === updatedServer.id ? { ...w, ...updates } : w))
    }
  }

  const handleRun = async (serverId: string) => {
    // Add to running set
    setRunningWorkflows(prev => new Set(prev).add(serverId))
    setActivityLogs(prev => ({ ...prev, [serverId]: [
      `${new Date().toLocaleTimeString()} Triggering workflow via GitHub Actions...`
    ] }))

    const result = await triggerWorkflow(serverId)

    if (!result.success) {
      setActivityLogs(prev => ({ ...prev, [serverId]: [
        ...(prev[serverId] || []),
        `${new Date().toLocaleTimeString()} ERROR: ${result.error}`
      ] }))
      setRunningWorkflows(prev => { const s = new Set(prev); s.delete(serverId); return s })
      // Update local status to show error
      setWorkflows(prev => prev.map(w => w.id === serverId ? { ...w, status: 'inactive' as const } : w))
      return
    }

    setActivityLogs(prev => ({ ...prev, [serverId]: [
      ...(prev[serverId] || []),
      `${new Date().toLocaleTimeString()} Workflow dispatched successfully. Monitoring...`
    ] }))
    setWorkflows(prev => prev.map(w => w.id === serverId ? { ...w, status: 'active' as const } : w))

    // Poll for status updates
    const pollInterval = setInterval(async () => {
      const status = await getWorkflowRunStatus(serverId)
      
      if (status.error) {
        setActivityLogs(prev => ({ ...prev, [serverId]: [
          ...(prev[serverId] || []),
          `${new Date().toLocaleTimeString()} Poll error: ${status.error}`
        ] }))
      } else {
        setActivityLogs(prev => ({ ...prev, [serverId]: [
          ...(prev[serverId] || []),
          ...status.logs.map(l => `${new Date().toLocaleTimeString()} ${l}`)
        ] }))
      }

      if (status.status === 'completed') {
        clearInterval(pollInterval)
        setRunningWorkflows(prev => { const s = new Set(prev); s.delete(serverId); return s })
        // Refresh workflows from DB to get updated health/status
        const data = await getWorkflows()
        setWorkflows(data)

        const conclusion = status.conclusion || 'unknown'
        setActivityLogs(prev => ({ ...prev, [serverId]: [
          ...(prev[serverId] || []),
          `${new Date().toLocaleTimeString()} Run completed: ${conclusion.toUpperCase()}`
        ] }))
      }
    }, 15000) // Poll every 15 seconds

    // Safety: stop polling after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setRunningWorkflows(prev => { const s = new Set(prev); s.delete(serverId); return s })
    }, 30 * 60 * 1000)
  }

  // Map to Server format for List View
  const serverData: Server[] = workflows.map(w => ({
    id: w.id,
    number: w.workflow_number,
    serviceName: w.name,
    osType: w.platform === "github_actions" ? "linux" : "ubuntu", // Map platform to available visual icons
    serviceLocation: w.location || "Unknown",
    countryCode: (w.region_code as Server["countryCode"]) || "us",
    ip: w.endpoint_url?.replace(/https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/workflows\//, "") || "N/A",
    dueDate: w.next_run_at ? new Date(w.next_run_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "Not Scheduled",
    cpuPercentage: w.health_score,
    status: w.status,
    category: w.category,
    platform: w.platform,
    toProcess: w.to_process ?? 0,
    processed: w.processed ?? 0,
  }))

  // Map to PortfolioCategory format for Grid View
  const portfolioData: PortfolioCategory[] = defaultPortfolioData.map(category => {
    const matchedWorkflows = workflows.filter(w => w.category === category.title)
    return {
      ...category,
      projects: matchedWorkflows.map(w => ({
        id: w.id,
        title: w.name,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" // Temporary placeholder image for now
      }))
    }
  })

  // Basic Filtering
  // Filtering & Sorting Logic
  const filteredServers = serverData
    .filter(s => {
      const matchesSearch = s.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === "All" || s.category === activeCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === "name") comparison = a.serviceName.localeCompare(b.serviceName)
      if (sortBy === "status") comparison = a.status.localeCompare(b.status)
      if (sortBy === "health") comparison = (b.cpuPercentage || 0) - (a.cpuPercentage || 0)
      return sortAsc ? comparison : -comparison
    })

  const categories = ["All", ...Array.from(new Set(workflows.map(w => w.category).filter(Boolean)))] as string[]


  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
         <TopHeader />
         
         <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
            <div className="max-w-[1400px] mx-auto">
                <div className="px-2 mb-10">
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-2 text-[var(--color-brand-text)]">Workflows Directory</h2>
                  <p className="text-[var(--color-brand-muted)] mb-8">Browse available automated workflows and data enrichment pipelines.</p>

                  {/* Top KPI Cards (Placeholders for now, can be wired later) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                      { label: 'Tasks completed', value: '1080', icon: CheckCircle2, growth: '+20%' },
                      { label: 'Workflows created', value: '320', icon: Users2, growth: '+20%' },
                      { label: 'Pipelines Active', value: '124', icon: CheckCircle2, growth: '+20%' },
                      { label: 'Time saved (hrs)', value: '1,366', icon: BadgeDollarSign, growth: '+20%' }
                    ].map((card, i) => (
                      <BudgetCard 
                        key={i}
                        title={card.label}
                        amount={card.value}
                        icon={card.icon}
                        trendLabel={card.growth}
                        trend={card.growth && card.growth.includes('-') ? 'down' : card.growth && card.growth.includes('Steady') ? 'neutral' : 'up'}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" size={18} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                        placeholder="Search workflows..." 
                        className="w-full bg-[var(--color-brand-surface-1)] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-brand-violet)]/50 focus:outline-none transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 relative">
                      {/* Sort controls */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSortAsc(!sortAsc); setPage(1) }}
                          className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors shadow-sm bg-[var(--color-brand-surface-1)]"
                          title={sortAsc ? "Ascending" : "Descending"}
                        >
                          {sortAsc ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => { setShowSort(!showSort); setShowFilters(false) }}
                            className={`flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-semibold transition-colors shadow-sm bg-[var(--color-brand-surface-1)] ${showSort ? 'border-[var(--color-brand-violet)]/50 text-white' : ''}`}
                          >
                            <SlidersHorizontal size={16} /> 
                            <span>Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                          </button>
                          
                          {showSort && (
                            <div className="absolute top-12 right-0 w-48 bg-[#1c1c1c] border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden">
                              {(['name', 'status', 'health'] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => { setSortBy(s); setShowSort(false) }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5 ${sortBy === s ? 'text-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/5' : 'text-white/70'}`}
                                >
                                  Sort by {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${viewMode === "grid" ? "bg-white/10 border-[var(--color-brand-violet)]/50 text-white" : "border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]"}`}
                      >
                        <LayoutGrid size={18} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${viewMode === "list" ? "bg-white/10 border-[var(--color-brand-violet)]/50 text-white" : "border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]"}`}
                      >
                        <TableProperties size={18} />
                      </button>

                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => { setShowFilters(!showFilters); setShowSort(false) }}
                          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shadow-sm ${showFilters ? 'border-[var(--color-brand-violet)]/50 bg-white/10 text-white' : 'border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-surface-1)]'}`}
                        >
                          <Filter size={18} />
                        </button>

                        {showFilters && (
                          <div className="absolute top-12 right-0 w-56 bg-[#1c1c1c] border border-white/10 rounded-lg shadow-2xl z-[60] overflow-hidden p-1">
                            <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
                              Filter by Category
                            </div>
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setShowFilters(false) }}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors hover:bg-white/5 ${activeCategory === cat ? 'text-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/5' : 'text-white/70'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button type="button" className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-4 py-2 h-10 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
                        <Plus size={18} strokeWidth={3} /> Add New
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                {loading ? (
                  <div className="flex justify-center items-center h-64 text-[var(--color-brand-muted)]">Loading workflows...</div>
                ) : viewMode === "grid" ? (
                  <ThreeDFolders data={portfolioData} />
                ) : (
                  <ServerManagementTable 
                    title="Workflows Setup" 
                    servers={filteredServers}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onRun={handleRun}
                    runningWorkflows={runningWorkflows}
                    activityLogs={activityLogs}
                  />
                )}
                {/* Pagination */}
                <PaginationBar 
                  page={page} 
                  setPage={setPage} 
                  hasMore={false} 
                  totalCount={workflows.length} 
                  currentLength={filteredServers.length} 
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                  noun="workflows"
                />
            </div>
         </div>
      </div>
    </div>
  )
}
