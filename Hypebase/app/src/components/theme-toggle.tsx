"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { SunIcon, MoonIcon } from "@/components/ui/animated-weather-icons"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-3 rounded-2xl bg-[var(--color-brand-surface-1)] w-11 h-11" />
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-3 rounded-2xl bg-[var(--color-brand-surface-1)] hover:bg-[var(--color-brand-surface-2)] border border-black/5 dark:border-white/5 transition-colors text-[var(--color-brand-text)] flex items-center justify-center relative shadow-sm"
      aria-label="Toggle theme"
    >
      <SunIcon size={20} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon size={20} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}
