"use client"

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

interface PaginationBarProps {
  page: number
  setPage: (page: number | ((p: number) => number)) => void
  hasMore: boolean
  itemsPerPage: number
  setItemsPerPage?: (items: number) => void
  totalCount: number
  currentLength: number
  noun?: string
}

export function PaginationBar({
  page,
  setPage,
  hasMore,
  itemsPerPage,
  setItemsPerPage,
  totalCount,
  currentLength,
  noun = "results"
}: PaginationBarProps) {
  if (currentLength === 0 && page === 1) return null

  const maxCount = Math.max(totalCount, (page - 1) * itemsPerPage + currentLength)
  const currentStart = (page - 1) * itemsPerPage + 1
  const currentEnd = Math.min(page * itemsPerPage, maxCount)

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 mt-8 bg-[#121214] border border-white/5 px-6 rounded-lg shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 text-xs font-bold text-[var(--color-brand-muted)]">
        <span>Showing</span>
        {setItemsPerPage && (
          <div className="relative group">
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1) }}
              className="appearance-none bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 pr-8 outline-none hover:border-[var(--color-brand-violet)]/40 transition-all cursor-pointer text-white"
            >
              {[12, 24, 48, 100].map(n => <option key={n} value={n} className="bg-[#1A1A1A]">{n}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <span className="opacity-60">{noun} per page</span>
        <div className="w-px h-4 bg-white/10 mx-2" />
        <span className="text-white font-black">
            {currentStart} - {currentEnd} <span className="text-[var(--color-brand-muted)] font-bold mx-1">of</span> {maxCount}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-all bg-[#1A1A1A]"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <div className="bg-[#1A1A1A] min-w-[36px] h-9 flex items-center justify-center px-3 rounded-lg border border-white/5 shadow-inner">
            <span className="text-white font-black text-sm">{page}</span>
        </div>
        
        <button 
          type="button"
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-all bg-[#1A1A1A]"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
