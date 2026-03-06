"use client"

import { useState } from "react"
import { X, UploadCloud, Trash2 } from "lucide-react"

interface FileUploaderModalProps {
  isOpen: boolean
  onClose: () => void
  onAttachFiles: (files: File[]) => void
}

export function FileUploaderModal({ isOpen, onClose, onAttachFiles }: FileUploaderModalProps) {
  const [files, setFiles] = useState<File[]>([])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
      <div className="bg-[var(--color-brand-surface-1)] w-full max-w-2xl rounded-lg border border-white/10 shadow-[0_0_80px_rgba(157,113,243,0.15)] overflow-hidden flex flex-col max-h-[80vh] text-[var(--color-brand-text)]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-[var(--color-brand-surface-2)]/30 to-transparent shrink-0">
           <h2 className="text-xl font-black font-heading tracking-tight">Upload Files</h2>
           <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto no-scrollbar space-y-4">
           {/* Upload Zone */}
           <div className="border border-dashed border-[var(--color-brand-violet)]/40 rounded-lg p-10 flex flex-col items-center justify-center text-center bg-[var(--color-brand-violet)]/5 relative group hover:bg-[var(--color-brand-violet)]/10 transition-colors">
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-14 h-14 rounded-lg bg-[var(--color-brand-surface-1)] border border-black/10 dark:border-white/10 flex items-center justify-center mb-4 text-[var(--color-brand-violet)] group-hover:scale-110 transition-transform shadow-sm">
                 <UploadCloud size={28} />
              </div>
              <p className="font-bold text-lg mb-2 text-[var(--color-brand-text)]"><span className="text-[var(--color-brand-violet)]">Click to upload</span> or drag and drop</p>
              <p className="text-[var(--color-brand-muted)] font-medium text-sm">SVG, PNG, JPG or GIF (max. 2MB)</p>
           </div>

           {/* File List */}
           {files.length > 0 && (
             <div className="space-y-3 pt-4">
               {files.map((file, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-black/10 dark:border-white/10 bg-[var(--color-brand-surface-2)]/30 group">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-surface-1)] flex flex-col items-center justify-center border border-black/5 dark:border-white/5 text-[var(--color-brand-muted)] shrink-0 shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-wider">{file.name.split('.').pop()?.substring(0,4)}</span>
                       </div>
                       <div className="min-w-0">
                          <p className="font-bold text-sm truncate text-[var(--color-brand-text)]">{file.name}</p>
                          <p className="text-[var(--color-brand-muted)] text-xs font-semibold mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(i)}
                      className="p-2.5 rounded-lg text-[var(--color-brand-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="p-6 border-t border-black/5 dark:border-white/5 shrink-0 flex items-center justify-end gap-3 bg-[var(--color-brand-surface-2)]/20">
           <button onClick={onClose} className="px-5 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white font-bold text-sm">Cancel</button>
           <button 
             onClick={() => { onAttachFiles(files); onClose() }}
             disabled={files.length === 0}
             className="px-5 py-2 bg-[var(--color-brand-violet)] text-white font-bold text-sm rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
              Attach Files {files.length > 0 && `(${files.length})`}
           </button>
        </div>
      </div>
    </div>
  )
}
