"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Search, ShieldCheck, TrendingUp, Zap, Hexagon, Fingerprint } from "lucide-react"
import { ProceduralGroundBackground } from "@/components/ui/animated-pattern-cloud"

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)] selection:bg-[var(--color-brand-violet)]/30 font-sans pb-12">
      
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[var(--color-brand-obsidian)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-heading font-extrabold text-2xl tracking-tighter">
            Hypebase<span className="text-[var(--color-brand-violet)]">.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
              Sign In
            </Link>
            <Link href="/login">
              <button className="bg-[var(--color-brand-obsidian)] border border-[var(--color-brand-magenta)] text-[var(--color-brand-text)] px-6 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(236,109,255,0.4)] hover:shadow-[0_0_25px_rgba(236,109,255,0.6)] hover:bg-[var(--color-brand-magenta)]/10 transition-all flex items-center gap-2 group">
                Request Demo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        <ProceduralGroundBackground />
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-violet)]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand-surface-1)] border border-white/5 text-xs font-semibold text-[var(--color-brand-violet)] tracking-widest uppercase mb-8 shadow-sm">
               <Zap size={14} fill="currentColor" />
               The Elite Intelligence Engine
            </div>

            <h1 className="font-heading text-6xl md:text-[5.5rem] font-bold tracking-tighter leading-[1.05] mb-8 max-w-4xl">
              Bypass the <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A0AEC0]">Gatekeepers.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--color-brand-muted)] max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
              Transform your talent discovery pipeline from weeks of dead-ends to minutes of precision. Access verified manager contacts, live momentum tracking, and brand conflict intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full">
               <Link href="/login">
                 <button className="h-14 px-8 bg-[var(--color-brand-obsidian)] border-2 border-[var(--color-brand-magenta)] text-[var(--color-brand-text)] rounded-full font-bold text-base transition-all flex items-center gap-2 group shadow-[0_0_30px_rgba(236,109,255,0.3)] hover:shadow-[0_0_40px_rgba(236,109,255,0.5)] hover:bg-[var(--color-brand-magenta)]/10 hover:scale-[1.02] w-full sm:w-auto justify-center">
                   Enter the Engine
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </Link>
               <Link href="/login">
                 <button className="h-14 px-8 bg-[var(--color-brand-surface-1)] hover:bg-[var(--color-brand-surface-2)] border border-black/10 dark:border-white/10 rounded-full font-bold text-base transition-all text-[var(--color-brand-text)] w-full sm:w-auto justify-center shadow-sm">
                   Interactive Demo
                 </button>
               </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Abstract UI Preview */}
      <section className="relative pb-32">
         <div className="max-w-6xl mx-auto px-6 relative">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="w-full relative rounded-[2.5rem] bg-[var(--color-brand-surface-1)] border border-white/5 shadow-2xl p-2 md:p-4 overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-violet)]/10 via-transparent to-[var(--color-brand-magenta)]/10 opacity-40 pointer-events-none" />
               <div className="relative bg-[var(--color-brand-obsidian)] rounded-[2rem] border border-white/5 w-full aspect-[16/9] md:aspect-[21/9] flex items-center justify-center overflow-hidden">
                  
                  {/* Central Glow */}
                  <div className="w-[500px] h-[500px] bg-[var(--color-brand-violet)]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

                  {/* Fake UI Render */}
                  <div className="absolute inset-0 grid grid-cols-12 gap-4 p-8 pointer-events-none opacity-80">
                      <div className="col-span-3 hidden md:flex flex-col gap-4">
                         <div className="h-24 rounded-2xl bg-[var(--color-brand-surface-1)]" />
                         <div className="h-48 rounded-2xl bg-[var(--color-brand-surface-1)] border border-white/5" />
                      </div>
                      <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
                         <div className="h-full rounded-3xl bg-[var(--color-brand-surface-2)] border border-[var(--color-brand-violet)]/20 shadow-[0_0_50px_rgba(124,58,237,0.1)] p-8 flex flex-col justify-end">
                            <h3 className="text-3xl font-heading font-extrabold text-[var(--color-brand-text)] mb-2">Anya Taylor-Joy</h3>
                            <div className="h-4 w-32 bg-white/10 rounded-md mb-8" />
                            <div className="h-12 w-full bg-[var(--color-brand-magenta)]/20 border border-[var(--color-brand-magenta)] shadow-[0_0_15px_rgba(236,109,255,0.3)] rounded-xl opacity-90" />
                         </div>
                      </div>
                      <div className="col-span-4 hidden md:flex flex-col justify-end gap-2 items-end">
                        <div className="h-12 w-1/4 bg-[var(--color-brand-neon)]/20 rounded-t-lg" />
                        <div className="h-20 w-1/4 bg-[var(--color-brand-neon)]/40 rounded-t-lg" />
                        <div className="h-32 w-1/4 bg-[var(--color-brand-neon)]/60 rounded-t-lg" />
                        <div className="h-48 w-1/4 bg-[var(--color-brand-neon)] rounded-t-lg relative">
                           <div className="absolute -top-12 -left-8 bg-black/80 px-4 py-2 rounded-xl border border-white/10 font-bold text-white text-lg font-heading shadow-xl">
                             +42% Growth
                           </div>
                        </div>
                      </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Feature Grids */}
      <section className="py-24 bg-[var(--color-brand-surface-1)] relative border-t border-b border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 max-w-3xl mx-auto">
               <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-8">Designed for the <span className="text-[var(--color-brand-violet)]">Strategic Connector.</span></h2>
               <p className="text-[var(--color-brand-muted)] text-lg leading-relaxed font-medium">
                  We stripped away the noise. Hypebase delivers clinical precision and actionable intelligence instantly, ensuring you are first to the table.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <FeatureCard 
                 icon={Fingerprint}
                 title="Verified Routing"
                 desc="Direct manager and agent emails parsed from verified industry networks. Stop guessing and start connecting."
               />
               <FeatureCard 
                 icon={TrendingUp}
                 title="Momentum Intel"
                 desc="Track social velocity and streaming spikes before they hit the trades. Identify rising stars mathematically."
               />
               <FeatureCard 
                 icon={ShieldCheck}
                 title="Conflict Scans"
                 desc="Instantly view historical brand alignments to ensure your casting suggestions never violate non-competes."
               />
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative text-center">
         <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-violet)]/5 to-transparent pointer-events-none" />
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-8">End the Wait. <br /> Own the Network.</h2>
            <Link href="/login">
              <button className="h-16 px-10 bg-[var(--color-brand-obsidian)] border-2 border-[var(--color-brand-magenta)] text-[var(--color-brand-text)] hover:bg-[var(--color-brand-magenta)]/10 rounded-full font-extrabold text-lg transition-all shadow-[0_0_30px_rgba(236,109,255,0.4)] hover:shadow-[0_0_50px_rgba(236,109,255,0.6)] hover:scale-[1.02] flex items-center justify-center gap-3 mx-auto uppercase tracking-widest mt-12">
                Join the Database <ArrowRight strokeWidth={3} />
              </button>
            </Link>
         </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 text-center text-[var(--color-brand-muted)] text-xs uppercase tracking-widest font-semibold">
         <p>© {new Date().getFullYear()} Hypebase. The Elite Talent Intelligence Engine.</p>
      </footer>

    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[var(--color-brand-obsidian)] border border-white/5 p-8 rounded-[2rem] hover:border-[var(--color-brand-violet)]/40 hover:bg-[#111218] transition-all duration-300 group shadow-lg">
       <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-surface-1)] border border-white/5 flex items-center justify-center mb-6 group-hover:bg-[var(--color-brand-violet)]/10 text-[#A0AEC0] group-hover:text-[var(--color-brand-violet)] transition-colors">
         <Icon size={32} strokeWidth={1.5} />
       </div>
       <h3 className="font-heading text-2xl font-bold mb-3 tracking-tight">{title}</h3>
       <p className="text-[#A0AEC0] text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  )
}
