"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, MapPin, Trash2, Pencil, Check, MoreVertical, Search } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { WorkflowActionPopover } from "./workflow-action-popover"

export interface EditorRowData {
  id: string
  image?: string
  title: string
  subtitle?: string
  status?: string
  tags?: string[]
  description?: string
  location?: string
  meta?: { label: string; value: string }[]
  socials?: { id: string; social_type: string; social_url: string }[]
  [key: string]: any
}

export interface EditorColumnDef {
  key: string
  label: string
  width?: string
  render?: (value: any, row: EditorRowData) => React.ReactNode
}

export interface EditorAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: (ids: string[]) => void
  variant?: 'default' | 'danger'
  showIf?: (row?: EditorRowData) => boolean
}

// --- Actions Dropdown ---
function ActionsDropdown({ actions, targetIds, label, size = 'md' }: {
  actions: EditorAction[]
  targetIds: string[]
  label?: string
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [open])

  const filteredActions = searchQuery
    ? actions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : actions

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); if (open) setSearchQuery('') }}
        className={`flex items-center gap-1.5 rounded-lg border transition-all select-none ${
          size === 'sm' 
            ? 'p-1.5 border-white/5 text-[var(--color-brand-muted)] hover:text-white hover:bg-white/10' 
            : 'px-3 h-10 border-white/10 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 shadow-sm'
        }`}
      >
        <MoreVertical size={size === 'sm' ? 14 : 16} />
        {label && <span className="text-sm font-semibold">{label}</span>}
        {label && <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: { type: 'spring', stiffness: 500, damping: 30 } }}
            exit={{ opacity: 0, height: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[280px] overflow-hidden"
          >
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-2xl">
              {/* Search */}
              <div className="px-2 pt-1.5 pb-1.5">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Search size={14} className="text-neutral-500 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search actions..."
                    className="bg-transparent border-none outline-none text-sm text-neutral-200 placeholder:text-neutral-600 w-full font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="mx-2 h-px bg-white/[0.06] mb-1" />

              {/* Actions list */}
              <div className="relative max-h-[240px] overflow-y-auto">
                {filteredActions.length > 0 ? filteredActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      action.onClick(targetIds)
                      setOpen(false)
                      setSearchQuery('')
                    }}
                    onMouseEnter={() => setHoveredId(action.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                      action.variant === 'danger'
                        ? hoveredId === action.id ? 'text-red-400 bg-red-500/10' : 'text-red-400/70'
                        : hoveredId === action.id ? 'text-white bg-white/5' : 'text-neutral-400'
                    }`}
                  >
                    <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                )) : (
                  <div className="px-3 py-4 text-center text-sm text-neutral-600 font-semibold">
                    No matching actions
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Animation variants ---
const expandedContentVariants: any = {
  hidden: {
    opacity: 0, height: 0,
    transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
  },
  visible: {
    opacity: 1, height: "auto",
    transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98], staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const childVariants: any = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
}

const pillVariants: any = {
  hidden: { opacity: 0, scale: 0.8, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
  hover: { scale: 1.05, y: -1, transition: { type: "spring", stiffness: 400, damping: 25 } },
  tap: { scale: 0.98 },
}

// --- Row ---
interface EditorRowProps {
  data: EditorRowData
  columns: EditorColumnDef[]
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRowClick?: (data: EditorRowData) => void
  actions: EditorAction[]
}

function EditorRow({ data, columns, isSelected, onSelect, onEdit, onDelete, onRowClick, actions }: EditorRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`border-b border-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-[var(--color-brand-violet)]/5' : 'bg-[#09090b] hover:bg-white/[0.03]'}`}
      onClick={() => onRowClick?.(data)}
    >
      <div className="flex items-center">
        {/* Checkbox */}
        <div className={`py-3 px-4 text-center border-r border-white/5 ${isSelected ? 'bg-[var(--color-brand-violet)]/10' : ''}`} style={{ width: '48px', flex: 'none' }} onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--color-brand-violet)]" 
          />
        </div>

        {/* Main row cells */}
        {columns.map((col) => (
          <div
            key={col.key}
            className="py-3 px-4 text-sm"
            style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
          >
            {col.render ? col.render(data[col.key], data) : (
              <span className="text-neutral-400 truncate block">{data[col.key] || '—'}</span>
            )}
          </div>
        ))}

        {/* Actions — icon buttons + dropdown */}
        <div className="py-3 px-4 flex items-center justify-end gap-1" style={{ width: '120px', flex: 'none' }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center p-0.5 bg-neutral-900 border border-white/10 rounded-lg">
            {onEdit && (
              <button
                onClick={() => onEdit(data.id)}
                className="p-1.5 rounded-md transition-all text-neutral-500 hover:text-white hover:bg-white/10"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirmDelete) {
                    onDelete(data.id)
                    setConfirmDelete(false)
                  } else {
                    setConfirmDelete(true)
                    setTimeout(() => setConfirmDelete(false), 3000)
                  }
                }}
                className={`p-1.5 rounded-md transition-all ${confirmDelete ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-neutral-500 hover:text-red-400 hover:bg-white/10'}`}
                title={confirmDelete ? "Click to confirm" : "Delete"}
              >
                {confirmDelete ? <Check size={14} /> : <Trash2 size={14} />}
              </button>
            )}
            
            <WorkflowActionPopover logs={data.workflow_logs || []} />
            
            {actions.length > 0 && (() => {
              const rowActions = actions.filter(a => !a.showIf || a.showIf(data));
              if (rowActions.length === 0) return null;
              return <ActionsDropdown actions={rowActions} targetIds={[data.id]} size="sm" />;
            })()}
          </div>
        </div>

        {/* Chevron */}
        <div className="py-3 px-3 flex items-center" style={{ width: '52px', flex: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white transition-colors bg-neutral-900 border border-white/10"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandedContentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 ml-12 border-l-2 border-[var(--color-brand-violet)]/30">
              {data.tags && data.tags.length > 0 && (
                <motion.div className="flex flex-wrap gap-2 mb-4" variants={childVariants}>
                  {data.tags.map((tag, index) => (
                    <motion.span key={index} variants={pillVariants} whileHover="hover" whileTap="tap"
                      className="px-3 py-1.5 text-neutral-300 rounded-lg text-[11px] font-bold cursor-default select-none bg-white/5 border border-white/10 uppercase tracking-wider">
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              )}
              {data.description && (
                <motion.p className="text-neutral-400 text-sm leading-relaxed mb-4 max-w-2xl" variants={childVariants}>
                  {data.description}
                </motion.p>
              )}
              {data.meta && data.meta.length > 0 && (
                <motion.div className="flex items-center gap-4 text-sm text-neutral-500" variants={childVariants}>
                  {data.meta.map((m, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-neutral-600">{m.label}:</span>
                      <span className="text-neutral-400">{m.value}</span>
                      {i < data.meta!.length - 1 && <span className="ml-3 w-px h-3 bg-white/10" />}
                    </span>
                  ))}
                </motion.div>
              )}
              {data.location && (
                <motion.div className="flex items-center gap-2 text-sm text-neutral-500 mt-3" variants={childVariants}>
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-violet)]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{data.location}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// --- Table ---
interface EditorTableProps {
  columns: EditorColumnDef[]
  data: EditorRowData[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onRowClick?: (data: EditorRowData) => void
  actions?: EditorAction[]
  isLoading?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

export function EditorTable({ columns, data, onEdit, onDelete, onRowClick, actions = [], isLoading, selectedIds: externalSelectedIds, onSelectionChange }: EditorTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set())
  
  const selectedIds = externalSelectedIds ?? internalSelectedIds
  const setSelectedIds = (val: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const next = typeof val === 'function' ? val(selectedIds) : val
    if (onSelectionChange) onSelectionChange(next)
    else setInternalSelectedIds(next)
  }

  const allSelected = data.length > 0 && data.every(row => selectedIds.has(row.id))
  const someSelected = data.some(row => selectedIds.has(row.id))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map(row => row.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center bg-neutral-900 text-neutral-500 text-[11px] uppercase tracking-wider border-b border-white/5">
        <div className="py-3 px-4 font-bold text-center border-r border-white/5" style={{ width: '48px', flex: 'none' }}>
          <input 
            type="checkbox" 
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-transparent text-[var(--color-brand-violet)] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--color-brand-violet)]" 
          />
        </div>
        {columns.map((col) => (
          <div key={col.key} className="py-3 px-4 font-bold"
            style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}>
            {col.label}
          </div>
        ))}
        <div className="py-3 px-4 font-bold text-right" style={{ width: '120px', flex: 'none' }}>Actions</div>
        <div style={{ width: '52px', flex: 'none' }} />
      </div>

      {/* Body */}
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-white/5 bg-[#09090b] animate-pulse">
            <div className="py-4 px-4" style={{ width: '48px', flex: 'none' }}><div className="w-3.5 h-3.5 bg-white/5 rounded" /></div>
            {columns.map((col, ci) => (
              <div key={ci} className="py-4 px-4" style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}>
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            ))}
            <div className="py-4 px-4" style={{ width: '120px', flex: 'none' }}><div className="h-4 bg-white/5 rounded w-1/2 ml-auto" /></div>
            <div style={{ width: '52px', flex: 'none' }} />
          </div>
        ))
      ) : data.length > 0 ? (
        data.map((row, index) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.04 }}
          >
            <EditorRow
              data={row}
              columns={columns}
              isSelected={selectedIds.has(row.id)}
              onSelect={(checked) => handleSelectRow(row.id, checked)}
              onEdit={onEdit}
              onDelete={onDelete}
              onRowClick={onRowClick}
              actions={actions}
            />
          </motion.div>
        ))
      ) : (
        <div className="py-16 text-center text-neutral-600 text-sm font-semibold uppercase tracking-widest bg-[#09090b]">
          No records found
        </div>
      )}
    </div>
  )
}

// Re-export ActionsDropdown for use in parent pages
export { ActionsDropdown }
