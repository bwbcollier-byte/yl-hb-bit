"use client"
import React from "react"
import { Calendar } from "lucide-react"

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function DatePicker({ className, label, icon, ...props }: DatePickerProps) {
  return (
    <div className="relative w-full">
      {/* 
        We use a standard date input but hide the native picker icon in CSS globally (or via classes if supported), 
        and overlay our own icon. Clicking anywhere on the input opens the native picker.
      */}
      <div className="relative flex items-center w-full bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden focus-within:border-[var(--color-brand-violet)]/50 transition-colors">
         <div className="pl-4 pr-3 text-[var(--color-brand-muted)] pointer-events-none">
           {icon || <Calendar size={18} />}
         </div>
         <input 
           type="date" 
           className="w-full bg-transparent py-3 pr-4 text-[13px] font-medium text-white outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative z-10"
           {...props}
         />
         <div className="absolute right-4 text-[var(--color-brand-muted)] pointer-events-none z-0">
           <Calendar size={16} />
         </div>
      </div>
    </div>
  )
}
