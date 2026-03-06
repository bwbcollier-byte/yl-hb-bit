"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, Plus } from "lucide-react";

export interface Card {
  id: string;
  title: string;
  status: "completed" | "updates-found" | "syncing";
  subtitle?: string;
  timestamp?: string;
}

interface AnimatedCardStatusListProps {
  title?: string;
  cards?: Card[];
  onSynchronize?: (cardId: string) => void;
  onAddCard?: () => void;
  onBack?: () => void;
  className?: string;
}

const defaultCards: Card[] = [
  { id: "1", title: "Import products from your store", status: "completed", subtitle: "42 items imported", timestamp: "5 mins ago" },
  { id: "2", title: "Unique selling points", status: "completed", subtitle: "Analysis complete", timestamp: "1 hour ago" },
  { id: "3", title: "Primary customers", status: "completed", subtitle: "Segmented into 4 groups", timestamp: "2 hours ago" },
  { id: "4", title: "Common words & phrases", status: "updates-found", subtitle: "2 new keywords detected", timestamp: "Just now" },
  { id: "5", title: "Company overview and offer details", status: "syncing", subtitle: "Extracting details...", timestamp: "In progress" },
];

export function AnimatedCardStatusList({
  title = "Fundamentals",
  cards: initialCards = defaultCards,
  onSynchronize,
  onAddCard,
  onBack,
  className = ""
}: AnimatedCardStatusListProps = {}) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeDashIndex, setActiveDashIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Cycle through dash indices every 100ms
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setActiveDashIndex(prev => (prev + 1) % 8);
    }, 100);
    
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const handleSynchronize = (cardId: string) => {
    if (onSynchronize) onSynchronize(cardId);
    setCards(prev => prev.map(card => card.id === cardId ? { ...card, status: "syncing" as const } : card));
    setTimeout(() => {
      setCards(prev => prev.map(card => card.id === cardId ? { ...card, status: "completed" as const } : card));
    }, 2500);
  };

  const getStatusIcon = (status: Card["status"]) => {
    switch (status) {
      case "completed":
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 5L4.5 7L7.5 3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case "updates-found":
        return (
          <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 2.5V5.5M5 7.5H5.01" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case "syncing":
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18">
              {Array.from({ length: 8 }).map((_, index) => {
                const angle = (index * 45) - 90;
                const radian = (angle * Math.PI) / 180;
                const radius = 7;
                const dashLength = 2;
                const startX = 9 + (radius - dashLength/2) * Math.cos(radian);
                const startY = 9 + (radius - dashLength/2) * Math.sin(radian);
                const endX = 9 + (radius + dashLength/2) * Math.cos(radian);
                const endY = 9 + (radius + dashLength/2) * Math.sin(radian);
                const isActive = index === activeDashIndex;
                return (
                  <line key={index} x1={startX} y1={startY} x2={endX} y2={endY} stroke={isActive ? "#8b5cf6" : "#4b5563"} strokeWidth="2.5" strokeLinecap="round" />
                );
              })}
            </svg>
          </div>
        );
    }
  };

  const getStatusText = (status: Card["status"]) => {
    switch (status) {
      case "updates-found": return "UPDATES FOUND";
      case "syncing": return "SYNCING";
      default: return null;
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    return 0;
  });

  return (
    <div className={`w-full mx-auto ${className}`}>
      <div className="rounded-lg p-6 bg-transparent">
        {/* Header - Repositioned Buttons */}
        <div className="flex items-center gap-4 mb-8 relative px-1">
          <motion.button
            onClick={() => onAddCard?.()}
            className="p-2 rounded-lg bg-[#1C1C1E]/80 cursor-pointer border border-white/10 hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
          
          <h1 className="text-xl font-heading font-extrabold text-white tracking-tight">{title}</h1>
        </div>

        {/* Cards */}
        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
          }}
        >
          <AnimatePresence>
            {sortedCards.map((card) => (
              <motion.div
                key={card.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.98 },
                  visible: { 
                    opacity: 1, y: 0, scale: 1,
                    transition: { type: "spring", stiffness: 300, damping: 30 }
                  }
                }}
                className="relative"
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
              >
                <motion.div 
                  className={`relative bg-[#1A1A1A] border ${expandedCardId === card.id ? 'border-[var(--color-brand-violet)]/40 shadow-[0_0_15px_rgba(138,43,226,0.1)]' : 'border-white/5'} rounded-lg p-4 overflow-hidden transition-all duration-300`}
                  whileHover={{ y: -1, border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={card.status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            {getStatusIcon(card.status)}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      <span className="text-white font-bold text-sm tracking-tight">{card.title}</span>
                    </div>

                    <div className="flex items-center min-w-0 h-8">
                      <AnimatePresence mode="wait">
                        {card.status === "updates-found" && hoveredCard === card.id ? (
                          <motion.button
                            key="sync-button"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); handleSynchronize(card.id); }}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase rounded-md hover:bg-white/10 transition-colors"
                          >
                            Synchronize
                          </motion.button>
                        ) : getStatusText(card.status) ? (
                          <motion.span
                            key="status-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-bold font-mono text-white/40 tracking-wider"
                          >
                            {getStatusText(card.status)}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Expandable Content Area */}
                  <AnimatePresence>
                    {expandedCardId === card.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden border-t border-white/5 pt-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Details</span>
                            <span className="text-xs text-white/70 font-medium">{card.subtitle || "No additional information."}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Logged At</span>
                            <span className="text-xs text-white/70 font-mono italic">{card.timestamp || "Unknown"}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
