"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShieldCheck, ArrowRight, Mail, Sparkles, Zap, Lock, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Inline SVG icons for Google and Facebook
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [showPassword, setShowPassword] = useState(false)
  const { ThemeToggle } = require("@/components/theme-toggle")

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsSubmitting(true)
    
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
           alert(error.message)
           setIsSubmitting(false)
           return
        }
        if (data.user) {
           // Create initial public profile
           await supabase.from("users").upsert({
             id: data.user.id,
             email: data.user.email,
             name_first: "New",
             name_last: "User"
           })
        }
        alert("Success! Check your email to confirm, or if confirmations are disabled, you can now log in.")
        setIsSubmitting(false)
        setAuthMode("login")
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
           alert(error.message)
           setIsSubmitting(false)
           return
        }
        router.push("/dashboard")
      }
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  const handleOAuth = (provider: "google" | "facebook") => {
    setIsSubmitting(true)
    // Simulate OAuth redirect
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex h-screen w-full bg-[var(--color-brand-obsidian)] text-[var(--color-brand-text)] overflow-hidden relative">
      <div className="absolute top-6 right-6 z-50">
         <ThemeToggle />
      </div>
        
      {/* Left Column: Brand Story */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-16 relative z-10">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[var(--color-brand-violet)]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        
        {/* Header */}
        <div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tighter flex items-center gap-1.5">
            Hypebase<span className="text-[var(--color-brand-violet)]">.</span>
          </h1>
        </div>

        {/* Hero Copy */}
        <div className="max-w-xl">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
           >
             <h2 className="font-heading text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Bypass the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A0AEC0]">Gatekeepers.</span>
             </h2>
             <p className="text-lg text-[var(--color-brand-muted)] leading-relaxed mb-10 w-4/5 font-medium">
                The elite intelligence engine connecting global brands to world-class talent. Accelerate your outreach from weeks to minutes.
             </p>
           </motion.div>

           {/* Feature Points */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3, duration: 0.6 }}
             className="space-y-5"
           >
              {[
                { icon: ShieldCheck, text: "Verified Direct Manager Contacts" },
                { icon: Zap, text: "Live Talent Momentum Tracking" },
                { icon: Sparkles, text: "Brand Conflict Intelligence" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-semibold text-[var(--color-brand-text)] bg-opacity-80 uppercase tracking-widest">
                  <div className="p-1.5 rounded-md bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] border border-[var(--color-brand-violet)]/20 shadow-sm">
                    <feat.icon size={16} />
                  </div>
                  {feat.text}
                </div>
              ))}
           </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-[var(--color-brand-muted)] font-medium uppercase tracking-widest">
           System Active — Indexing 1.2M+ Profiles
        </div>
      </div>

      {/* Right Column: Auth Modal Box */}
      <div className="w-full lg:w-[45%] bg-[var(--color-brand-surface-1)] border-l border-white/5 relative flex items-center justify-center p-8 lg:p-16">
          
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--color-brand-violet)]/5 blur-[100px] rounded-full pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-sm"
          >
             {/* Mobile Brand */}
             <div className="lg:hidden mb-12 text-center">
                <h1 className="font-heading font-extrabold text-3xl tracking-tighter">
                  Hypebase<span className="text-[var(--color-brand-violet)]">.</span>
                </h1>
                <p className="text-[var(--color-brand-muted)] text-sm mt-2">The Elite Intelligence Engine</p>
             </div>

             <div className="text-center mb-8">
               <h3 className="font-heading text-3xl font-bold mb-2 tracking-tight">
                 {authMode === "login" ? "Welcome Back" : "Create Account"}
               </h3>
               <p className="text-sm font-medium text-[var(--color-brand-muted)]">
                 {authMode === "login" ? "Sign in to access your workspace." : "Join the industry's premier contact engine."}
               </p>
             </div>

             {/* OAuth Buttons */}
             <div className="space-y-3 mb-6 relative z-10">
               <button 
                 onClick={() => handleOAuth("google")}
                 disabled={isSubmitting}
                 className="w-full h-12 bg-[var(--color-brand-surface-2)] hover:bg-[var(--color-brand-surface-2)]/80 border border-white/10 hover:border-white/20 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-3 text-[var(--color-brand-text)] disabled:opacity-50 group"
               >
                 <GoogleIcon />
                 {authMode === "login" ? "Sign in with Google" : "Sign up with Google"}
               </button>

               <button 
                 onClick={() => handleOAuth("facebook")}
                 disabled={isSubmitting}
                 className="w-full h-12 bg-[var(--color-brand-surface-2)] hover:bg-[var(--color-brand-surface-2)]/80 border border-white/10 hover:border-white/20 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-3 text-[var(--color-brand-text)] disabled:opacity-50 group"
               >
                 <FacebookIcon />
                 {authMode === "login" ? "Sign in with Facebook" : "Sign up with Facebook"}
               </button>
             </div>

             {/* Divider */}
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="flex-1 h-px bg-white/10" />
               <span className="text-xs font-semibold uppercase tracking-widest text-[#A0AEC0]/60">or</span>
               <div className="flex-1 h-px bg-white/10" />
             </div>

             <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold uppercase tracking-widest text-[#A0AEC0] ml-1">Work Email</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#A0AEC0] group-focus-within:text-[var(--color-brand-violet)] transition-colors">
                       <Mail size={18} />
                     </div>
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                       placeholder="you@agency.com"
                       className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-black/10 dark:border-white/10 focus:border-[var(--color-brand-violet)]/50 transition-all rounded-lg py-3 pl-10 pr-4 text-sm font-medium text-[var(--color-brand-text)] placeholder:text-[#A0AEC0]/40"
                     />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-semibold uppercase tracking-widest text-[#A0AEC0] ml-1">Password</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#A0AEC0] group-focus-within:text-[var(--color-brand-violet)] transition-colors">
                       <Lock size={18} />
                     </div>
                     <input 
                       type={showPassword ? "text" : "password"} 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       placeholder="••••••••"
                       className="w-full bg-[var(--color-brand-surface-2)] outline-none border border-black/10 dark:border-white/10 focus:border-[var(--color-brand-violet)]/50 transition-all rounded-lg py-3 pl-10 pr-12 text-sm font-medium text-[var(--color-brand-text)] placeholder:text-[#A0AEC0]/40"
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute inset-y-0 right-3 flex items-center text-[#A0AEC0] hover:text-[var(--color-brand-text)] transition-colors"
                     >
                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                </div>

                {authMode === "login" && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-medium text-[var(--color-brand-violet)] hover:text-[var(--color-brand-violet)]/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[var(--color-brand-violet)] text-white hover:bg-[var(--color-brand-violet)]/90 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(6,193,73,0.15)] hover:shadow-[0_0_25px_rgba(6,193,73,0.25)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
             </form>

             <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
                 <button 
                   onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                   className="text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
                 >
                   {authMode === "login" ? (
                     <>Don&apos;t have an account? <span className="text-[var(--color-brand-violet)] font-semibold">Sign up</span></>
                   ) : (
                     <>Already have an account? <span className="text-[var(--color-brand-violet)] font-semibold">Sign in</span></>
                   )}
                 </button>

                 <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#A0AEC0]/40 pt-2">
                    <Lock size={12} /> Secure Authentication via Supabase
                 </div>
             </div>

          </motion.div>
      </div>
    </div>
  )
}
