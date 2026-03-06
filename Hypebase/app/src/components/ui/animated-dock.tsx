"use client" 

import * as React from "react"
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
 
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import Link from "next/link";
 
const cn = (...args: any[]) => twMerge(clsx(args));
 
export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}
 
export interface DockItemData {
  link: string;
  Icon: React.ReactNode;
  target?: string;
}
 
export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);
 
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-14 items-end gap-3 rounded-xl bg-[var(--color-brand-surface-2)]/50 border border-black/5 dark:border-white/5 shadow-sm px-3 pb-2",
        className,
      )}
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX}>
          <Link
            href={item.link}
            target={item.target}
            className="grow flex items-center justify-center w-full h-full text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
          >
            {item.Icon}
          </Link>
        </DockItem>
      ))}
    </motion.div>
  );
};
 
interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
}
 
export const DockItem = ({ mouseX, children }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [40, 60], [1, 1.3]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="aspect-square w-10 rounded-lg bg-[var(--color-brand-surface-1)] border border-black/5 dark:border-white/5 flex items-center justify-center relative shadow-sm"
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full grow absolute"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
