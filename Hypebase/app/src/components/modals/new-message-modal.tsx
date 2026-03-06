"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
  users: any[]
  onStartChat: (user: any) => void
}

export function NewMessageModal({ isOpen, onClose, users, onStartChat }: NewMessageModalProps) {
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[var(--color-brand-surface-1)] w-full max-w-lg rounded-lg border border-white/10 shadow-[0_0_80px_rgba(157,113,243,0.15)] overflow-hidden flex flex-col bg-opacity-95 text-[var(--color-brand-text)]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/30 to-transparent shrink-0">
           <h2 className="text-xl font-black font-heading tracking-tight">New message</h2>
           <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-3 shrink-0">
          <span className="font-bold text-lg text-[var(--color-brand-text)] pl-2">To :</span>
          <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-transparent border-none outline-none text-[var(--color-brand-text)] placeholder:text-[var(--color-brand-muted)] text-base font-medium py-2"
               autoFocus
             />
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar max-h-[50vh]">
          <h4 className="text-[13px] font-bold text-[var(--color-brand-text)] mb-4 px-1">Suggestions</h4>
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <label 
                key={user.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${selectedUserId === user.id ? 'bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)]/30' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-black/5 dark:border-white/10 shrink-0">
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-[var(--color-brand-text)] text-base">{user.name}</span>
                </div>
                <div className="pr-2">
                  <input 
                    type="radio" 
                    name="user" 
                    checked={selectedUserId === user.id} 
                    onChange={() => setSelectedUserId(user.id)}
                    className="w-5 h-5 accent-[var(--color-brand-violet)] cursor-pointer"
                  />
                </div>
              </label>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-[var(--color-brand-muted)] text-sm italic py-4 px-1">No users found.</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-black/5 dark:border-white/5 shrink-0 bg-[var(--color-brand-surface-2)]/20">
           <button 
             disabled={!selectedUserId}
             onClick={() => {
               const user = users.find(u => u.id === selectedUserId)
               if(user) {
                 onStartChat(user)
                 onClose()
               }
             }}
             className="w-full py-2 bg-[var(--color-brand-violet)] hover:bg-[var(--color-brand-violet)]/90 text-white font-bold text-sm rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
              Start conversation
           </button>
        </div>
      </div>
    </div>
  )
}
