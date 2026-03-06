import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { BentoStage } from "@/components/bento-stage"
import { FolderHeart, Users, CheckCircle, FilePenLine } from "lucide-react"
import { MOCK_CAMPAIGNS } from "@/lib/mock-data"

export default function CampaignsDirectory() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-brand-obsidian)]">
      <div className="hidden md:block">
        <ObsidianSidebar />
      </div>

      <BentoStage>
        <header className="col-span-12 flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight mb-2">Campaign Shortlists</h2>
            <p className="text-[var(--color-brand-muted)] text-sm">Organize targets, build rosters, and manage your structured outreach campaigns.</p>
          </div>
          
          <button className="bg-[var(--color-brand-surface-1)] hover:bg-[var(--color-brand-magenta)]/10 hover:scale-[1.02] shadow-[0_0_15px_rgba(236,109,255,0.2)] border border-[var(--color-brand-magenta)] text-white px-5 py-2.5 rounded-full font-bold transition-all mt-4 md:mt-0">
             + New Campaign
          </button>
        </header>

        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CAMPAIGNS.map(campaign => (
                <div key={campaign.id} className="bg-[var(--color-brand-surface-1)] border border-black/5 dark:border-white/5 rounded-3xl p-6 group hover:border-[var(--color-brand-violet)]/50 transition-all cursor-pointer relative overflow-hidden">
                   
                   <div className="flex items-start justify-between mb-8">
                      <div className="p-3 bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] rounded-2xl group-hover:scale-110 transition-transform">
                          <FolderHeart size={24} />
                      </div>
                      
                      <div className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase tracking-wider ${
                        campaign.status === 'Active' ? 'bg-[var(--color-brand-neon)]/10 text-[var(--color-brand-neon)] border border-[var(--color-brand-neon)]/20' : 
                        campaign.status === 'Scouting' ? 'bg-[var(--color-brand-magenta)]/10 text-[var(--color-brand-magenta)] border border-[var(--color-brand-magenta)]/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                         {campaign.status}
                      </div>
                   </div>

                   <h3 className="font-heading text-xl font-bold text-[var(--color-brand-text)] tracking-tight leading-snug mb-2">{campaign.name}</h3>
                   <p className="text-xs text-[var(--color-brand-muted)] flex items-center gap-1.5 font-medium"><FilePenLine size={14} /> Updated {campaign.lastUpdated}</p>
                   
                   <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-text)] bg-opacity-80">
                         <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10 shadow-inner">
                           <Users size={16} className="text-[var(--color-brand-violet)]" />
                         </span>
                         {campaign.talentCount} Targets
                      </div>
                      <div className="text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-violet)] transition-colors">
                        <CheckCircle size={20} />
                      </div>
                   </div>
                </div>
            ))}
        </div>
      </BentoStage>
    </div>
  )
}
