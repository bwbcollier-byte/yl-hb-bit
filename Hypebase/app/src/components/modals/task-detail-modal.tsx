"use client"
import { useState } from "react"
import { X, MoreHorizontal, Maximize2, Tag, Users2, Activity, Flag, Calendar as CalendarIcon, Target } from "lucide-react"

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task?: any
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState("description")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-black/10 dark:border-white/5 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-black/5 dark:border-white/5 text-sm font-medium text-zinc-500 dark:text-[var(--color-brand-muted)]">
           <div className="flex items-center gap-4">
              <button className="hover:text-black dark:hover:text-white transition-colors">
                <Maximize2 size={16} />
              </button>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                 <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Workspace</span>
                 <span>/</span>
                 <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Projects</span>
                 <span>/</span>
                 <span className="text-zinc-800 dark:text-white font-semibold">Project Name</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button className="hover:text-black dark:hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
              <button onClick={onClose} className="hover:text-black dark:hover:text-white transition-colors"><X size={20} /></button>
           </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex flex-col gap-8">
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
             {task?.title || "The title of your task goes here"}
           </h1>

           {/* Properties Grid */}
           <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-y-6 items-start text-sm">
             
             {/* Category */}
             <div className="flex items-center gap-2 text-zinc-500 dark:text-[var(--color-brand-muted)] font-medium">
               <Tag size={16} /> Category
             </div>
             <div>
               <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/20 text-zinc-800 dark:text-white font-semibold text-xs shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                 <div className="w-2 h-2 rounded-full bg-blue-600" /> Web Design
               </span>
             </div>

             {/* Assignee */}
             <div className="flex items-center gap-2 text-zinc-500 dark:text-[var(--color-brand-muted)] font-medium pt-1">
               <Users2 size={16} /> Assignee
             </div>
             <div className="flex flex-wrap gap-3 items-center">
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/20 px-2 py-1 rounded-full border border-zinc-100 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                 <img src="https://i.pravatar.cc/150?u=1" className="w-6 h-6 rounded-full" />
                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pr-2">John Doe</span>
               </div>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/20 px-2 py-1 rounded-full border border-zinc-100 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                 <img src="https://i.pravatar.cc/150?u=2" className="w-6 h-6 rounded-full" />
                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pr-2">Jane Smith</span>
               </div>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/20 px-2 py-1 rounded-full border border-zinc-100 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                 <img src="https://i.pravatar.cc/150?u=3" className="w-6 h-6 rounded-full" />
                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pr-2">Emily Williams</span>
               </div>
               {/* Add more mock avatars here representing the second row in the screenshot */}
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/20 px-2 py-1 rounded-full border border-zinc-100 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                 <img src="https://i.pravatar.cc/150?u=4" className="w-6 h-6 rounded-full" />
                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pr-2">Olivia Davis</span>
               </div>
               <div className="flex items-center gap-2 bg-zinc-50 dark:bg-black/20 px-2 py-1 rounded-full border border-zinc-100 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                 <img src="https://i.pravatar.cc/150?u=5" className="w-6 h-6 rounded-full" />
                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pr-2">Daniel Miller</span>
               </div>
             </div>

             {/* Status */}
             <div className="flex items-center gap-2 text-zinc-500 dark:text-[var(--color-brand-muted)] font-medium">
               <Target size={16} /> Status
             </div>
             <div className="flex items-center gap-2 text-zinc-800 dark:text-white font-semibold cursor-pointer">
               <Activity size={16} className="text-zinc-400" /> In Progress
             </div>

             {/* Priority */}
             <div className="flex items-center gap-2 text-zinc-500 dark:text-[var(--color-brand-muted)] font-medium">
               <Flag size={16} /> Priority
             </div>
             <div>
               <span className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                 High
               </span>
             </div>

             {/* Due date */}
             <div className="flex items-center gap-2 text-zinc-500 dark:text-[var(--color-brand-muted)] font-medium">
               <CalendarIcon size={16} /> Due date
             </div>
             <div className="text-zinc-800 dark:text-white font-semibold cursor-pointer">
               July 2nd, 2024
             </div>

           </div>

           {/* Tabs */}
           <div className="border-b border-black/10 dark:border-white/10 flex gap-6 mt-4">
              <button 
                onClick={() => setActiveTab('description')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'description' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-[var(--color-brand-muted)] hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-[var(--color-brand-muted)] hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Comments 
                <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-sm">4</span>
              </button>
              <button 
                onClick={() => setActiveTab('attachments')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'attachments' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-[var(--color-brand-muted)] hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                Attachments
                <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-sm">4</span>
              </button>
           </div>

           {/* Tab Content */}
           <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed space-y-4">
              {activeTab === 'description' && (
                <>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis congue tortor et orci dictum hendrerit. Maecenas pulvinar facilisis faucibus.
                  </p>
                  <p>
                    Aenean quis fermentum metus. Quisque vulputate auctor eleifend.
                  </p>
                </>
              )}
              {activeTab === 'comments' && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                   {/* Placeholder for comments */}
                   <p>No new comments to display.</p>
                </div>
              )}
              {activeTab === 'attachments' && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                   {/* Placeholder for attachments */}
                   <p>No attachments uploaded yet.</p>
                </div>
              )}
           </div>

        </div>
      </div>
    </div>
  )
}
