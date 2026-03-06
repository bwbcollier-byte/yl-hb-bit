"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  href?: string;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
}

export type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  defaultSelected?: number | null;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring" as const, bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  defaultSelected = null
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(defaultSelected);
  const outsideClickRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (defaultSelected !== null) {
      setSelected(defaultSelected);
    }
  }, [defaultSelected]);

  useOnClickOutside(outsideClickRef, () => {
    // Kept for closing custom behavior if needed, but for nav we might want to keep selection
  });

  const handleSelect = (index: number, tab: Tab) => {
    setSelected(index);
    onChange?.(index);
    if (tab.href) {
      window.location.href = tab.href;
    }
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1px] bg-white/10" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-white/5 bg-[#161616]/80 p-1.5 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => handleSelect(index, tab)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 outline-none",
              selected === index
                ? cn("bg-white/10", activeColor)
                : "text-[var(--color-brand-muted)] hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
