"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCardStatusList, type Card as StatusCard } from "@/components/ui/card-status-list";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LucideIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface WorkflowLog {
  workflow: string;
  date: string;
  result: string;
  status: "success" | "error" | "skipped_not_found" | "started" | string;
}

interface WorkflowActionPopoverProps {
  logs: WorkflowLog[];
}

function getIconForStatus(status: string): LucideIcon {
  if (status === "success" || status === "completed") return CheckCircle2;
  if (status === "error") return XCircle;
  return Activity;
}

export function WorkflowActionPopover({ logs }: WorkflowActionPopoverProps) {
  const [tab, setTab] = useState("all");
  const [showAllModal, setShowAllModal] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Parse logs into notification format
  const notifications = [...logs].reverse().map((log, index) => ({
    id: index,
    title: typeof log.workflow === 'string' ? log.workflow.replace(/_/g, ' ') : "Workflow Event",
    result: log.result || "No details provided",
    timestamp: log.date ? new Date(log.date).toLocaleString() : "Unknown date",
    status: log.status || "started",
    icon: getIconForStatus(log.status || "")
  }));

  const errorsCount = notifications.filter(n => n.status === "error").length;

  const filtered = tab === "errors" 
    ? notifications.filter(n => n.status === "error") 
    : notifications;

  // Convert logs to card-status-list format for the modal
  const mappedCards: StatusCard[] = logs.map((log, i) => ({
    id: String(i),
    title: typeof log.workflow === 'string' ? log.workflow.replace(/_/g, ' ') : "Workflow Event",
    subtitle: log.result || "No details provided",
    timestamp: log.date ? new Date(log.date).toLocaleString() : "Unknown date",
    status: log.status === "error" ? "updates-found" : log.status === "started" ? "syncing" : "completed"
  }));

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md transition-all text-neutral-500 hover:text-white hover:bg-white/10 relative"
            title="Workflow History"
          >
            <Activity size={14} />
            {errorsCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[380px] p-0 bg-neutral-900 border-white/10 shadow-2xl z-50 overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 bg-neutral-900/50">
              <TabsList className="bg-white/5 border border-white/5">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-neutral-400">
                  All Activity
                </TabsTrigger>
                <TabsTrigger value="errors" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-neutral-400 gap-1.5">
                  Errors
                  {errorsCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px] min-w-[16px] bg-red-500/20 text-red-400 border-red-500/20">
                      {errorsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto no-scrollbar bg-neutral-900">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-neutral-500">
                  No workflow history found.
                </div>
              ) : (
                filtered.map((n) => {
                  const Icon = n.icon;
                  const isError = n.status === "error";
                  const isSuccess = n.status === "success";
                  return (
                    <div
                      key={n.id}
                      className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className={`mt-0.5 ${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-neutral-400'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-neutral-200 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {n.result}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">
                          {n.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>

          {/* Footer */}
          <div className="p-2 border-t border-white/5 bg-neutral-900/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-[var(--color-brand-violet)] hover:text-white hover:bg-[var(--color-brand-violet)]/20"
              onClick={() => {
                setPopoverOpen(false);
                setShowAllModal(true);
              }}
            >
              View all workflow details
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Full Modal View Using AnimatedCardStatusList */}
      <AnimatePresence>
        {showAllModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pt-20">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setShowAllModal(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar bg-[#09090b] border border-white/10 rounded-lg shadow-2xl"
            >
              <button 
                onClick={() => setShowAllModal(false)}
                className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              
              <AnimatedCardStatusList 
                title="Workflow Execution History"
                cards={mappedCards.length > 0 ? mappedCards.reverse() : [{ id: "empty", title: "No workflows have been run yet.", status: "completed" }]}
                className="max-w-2xl text-white"
                onBack={() => setShowAllModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
