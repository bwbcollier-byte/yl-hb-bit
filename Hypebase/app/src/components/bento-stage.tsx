"use client"
import { motion } from "framer-motion"

export function BentoStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-[var(--color-brand-obsidian)] p-8 overflow-y-auto no-scrollbar">
      <div className="max-w-[1400px] mx-auto hidden lg:grid grid-cols-12 gap-6 relative">
        {/* We would place a search bar up top, but inside the children tree */}
        {children}
      </div>
      
      {/* Mobile view overrides */}
      <div className="lg:hidden flex flex-col space-y-4">
        {children}
      </div>
    </div>
  )
}
