import Link from "next/link"
import { HomeIcon, CompassIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[var(--color-brand-obsidian)] text-white">
      {/* Ambient Background Glows */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-[var(--color-brand-violet)]/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-[var(--color-brand-neon)]/5 blur-[100px] rounded-full pointer-events-none" />

      <Empty className="relative z-10 border-white/10 bg-white/5 backdrop-blur-md shadow-2xl rounded-[2rem] p-8 md:p-16 max-w-2xl border-solid">
        <EmptyHeader>
          <EmptyTitle className="font-heading font-black text-8xl md:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 drop-shadow-sm">
            404
          </EmptyTitle>
          <EmptyDescription className="mt-4 text-base font-medium text-[var(--color-brand-muted)] max-w-sm text-balance leading-relaxed">
            The page you're looking for might have been moved or doesn't exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button asChild className="border border-[var(--color-brand-violet)] bg-[#09090b] hover:bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_10px_rgba(138,43,226,0.15)]">
              <Link href="/dashboard">
                <HomeIcon className="size-5 mr-3" />
                Go Home
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all">
              <Link href="/dashboard">
                <CompassIcon className="size-5 mr-3" />
                Explore
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>

      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] font-black text-[var(--color-brand-muted)] uppercase tracking-[0.5em] opacity-40">
          Hypebase / Core Infrastructure / 404
        </p>
      </div>
    </div>
  )
}
