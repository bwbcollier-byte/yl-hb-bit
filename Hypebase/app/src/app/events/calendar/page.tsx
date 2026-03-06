"use client"
import { useState } from "react"
import { ObsidianSidebar } from "@/components/obsidian-sidebar"
import { TopHeader } from "@/components/top-header"
import {
  ChevronLeft, ChevronRight, Plus, SlidersHorizontal, Filter, Bookmark, CalendarDays
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  title: string
  emoji: string
  color: "green" | "violet" | "blue" | "orange" | "red"
  days: number[] // which day-of-month numbers this event appears on
}

// ─── Mock event data for March 2026 ──────────────────────────────────────────

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Out of office",
    emoji: "👋",
    color: "orange",
    days: [2, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 23, 25, 27, 29, 30],
  },
  {
    id: "2",
    title: "All hands meeting",
    emoji: "👥",
    color: "violet",
    days: [2, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 23, 25, 27, 29, 30],
  },
  {
    id: "3",
    title: "Artist pitch call",
    emoji: "🎤",
    color: "green",
    days: [3, 10, 17, 24],
  },
  {
    id: "4",
    title: "Deal review",
    emoji: "📋",
    color: "blue",
    days: [5, 12, 19, 26],
  },
]

const EVENT_COLORS: Record<string, string> = {
  green: "bg-[var(--color-brand-violet)]/15 text-[var(--color-brand-violet)] border-l-2 border-[var(--color-brand-violet)]",
  violet: "bg-purple-500/10 text-purple-300 border-l-2 border-purple-400",
  blue: "bg-blue-500/10 text-blue-300 border-l-2 border-blue-400",
  orange: "bg-amber-500/10 text-amber-300 border-l-2 border-amber-400",
  red: "bg-red-500/10 text-red-300 border-l-2 border-red-400",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns the ISO weekday of the 1st (1=Mon … 7=Sun) */
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay() // 0=Sun
  return day === 0 ? 7 : day // convert to Mon-based
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventsCalendarPage() {
  const today = new Date() // 2026-03-03
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstWeekday = getFirstDayOfMonth(viewYear, viewMonth) // 1–7

  // Previous month days to pad the grid
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1)
  const leadingBlanks = firstWeekday - 1

  // Build a flat 6-row × 7-col grid
  const gridCells: { day: number; currentMonth: boolean }[] = []
  for (let i = leadingBlanks - 1; i >= 0; i--) {
    gridCells.push({ day: prevMonthDays - i, currentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ day: d, currentMonth: true })
  }
  const trailing = 42 - gridCells.length
  for (let d = 1; d <= trailing; d++) {
    gridCells.push({ day: d, currentMonth: false })
  }

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }
  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDay(today.getDate())
  }

  const monthStart = `${MONTHS[viewMonth].slice(0, 3)} 01, ${viewYear}`
  const monthEnd = `${MONTHS[viewMonth].slice(0, 3)} ${daysInMonth}, ${viewYear}`

  const isToday = (day: number, currentMonth: boolean) =>
    currentMonth &&
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const eventsForDay = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return []
    return MOCK_EVENTS.filter((e) => e.days.includes(day))
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--color-brand-obsidian)]">
      {/* Sidebar */}
      <div className="hidden md:block w-[84px] shrink-0 relative z-50">
        <ObsidianSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full text-[var(--color-brand-text)]">
        <TopHeader />

        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={20} className="text-[var(--color-brand-violet)]" />
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight">Events Calendar</h2>
                </div>
                <p className="text-[var(--color-brand-muted)] text-sm">
                  Browse and manage all scheduled events across your talent network.
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-medium transition-colors">
                  <SlidersHorizontal size={15} /> Sort
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-medium transition-colors">
                  <Bookmark size={15} />
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-sm font-medium transition-colors">
                  <Filter size={15} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white text-sm font-bold transition-colors shadow-sm">
                  <Plus size={16} /> Add new
                </button>
              </div>
            </div>

            {/* ── Calendar Card ── */}
            <div className="bg-[var(--color-brand-surface-1)] border border-white/5 rounded-lg overflow-hidden shadow-sm">

              {/* Month nav row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/5">
                <div className="flex items-center gap-4">
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center w-12 h-14 bg-[var(--color-brand-violet)] rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 leading-none">
                      {MONTHS[viewMonth].slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-2xl font-extrabold text-white leading-tight">
                      {String(viewYear).slice(2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold">
                      {MONTHS[viewMonth]} {viewYear}
                    </h3>
                    <p className="text-xs text-[var(--color-brand-muted)]">
                      {monthStart} – {monthEnd}
                    </p>
                  </div>
                </div>

                {/* Prev / Today / Next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-4 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button className="flex items-center gap-2 ml-2 px-4 h-9 rounded-lg bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white text-sm font-bold transition-colors shadow-sm">
                    <Plus size={15} /> Add event
                  </button>
                </div>
              </div>

              {/* Day-name header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }} className="border-b border-white/5">
                {DAY_NAMES.map((name, i) => (
                  <div
                    key={name}
                    className={`py-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--color-brand-muted)] ${i < 6 ? "border-r border-white/5" : ""}`}
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar grid — 6 rows × 7 cols */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {gridCells.map((cell, idx) => {
                  const dayEvents = eventsForDay(cell.day, cell.currentMonth)
                  const todayCell = isToday(cell.day, cell.currentMonth)
                  const selected = selectedDay === cell.day && cell.currentMonth
                  const isWeekend = idx % 7 >= 5

                  return (
                    <div
                      key={idx}
                      onClick={() => cell.currentMonth && setSelectedDay(cell.day)}
                      className={`min-h-[120px] p-2 border-b border-r border-white/5 flex flex-col gap-1 cursor-pointer transition-colors group
                        ${cell.currentMonth ? "hover:bg-white/[0.02]" : "opacity-30"}
                        ${isWeekend && cell.currentMonth ? "bg-white/[0.01]" : ""}
                        ${selected ? "bg-[var(--color-brand-violet)]/5" : ""}
                      `}
                    >
                      {/* Day number */}
                      <div className="flex justify-start mb-1">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors
                            ${todayCell
                              ? "bg-[var(--color-brand-violet)] text-white"
                              : "text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)]"
                            }`}
                        >
                          {cell.day}
                        </span>
                      </div>

                      {/* Events */}
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <div
                            key={evt.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate ${EVENT_COLORS[evt.color]}`}
                          >
                            <span>{evt.emoji}</span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-[var(--color-brand-muted)] px-1">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex items-center gap-6 px-1">
              {MOCK_EVENTS.map((evt) => (
                <div key={evt.id} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    evt.color === "green" ? "bg-[var(--color-brand-violet)]"
                    : evt.color === "violet" ? "bg-purple-400"
                    : evt.color === "blue" ? "bg-blue-400"
                    : evt.color === "orange" ? "bg-amber-400"
                    : "bg-red-400"
                  }`} />
                  <span className="text-xs font-medium text-[var(--color-brand-muted)]">
                    {evt.emoji} {evt.title}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
