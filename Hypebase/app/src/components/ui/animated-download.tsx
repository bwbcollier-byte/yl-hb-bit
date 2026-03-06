"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DownloadProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
  totalRecords?: number;
  processedRecords?: number;
}

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const getRandomInt = (max: number) => Math.floor(Math.random() * max);

export function AnimatedDownload({
  className,
  isAnimating = false,
  onAnimationComplete,
  totalRecords,
  processedRecords = 0,
}: DownloadProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [filesCount, setFilesCount] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // HyperText animation state
  const [displayText, setDisplayText] = useState("READY".split(""));
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  const [targetText, setTargetText] = useState("READY");
  const [textIterations, setTextIterations] = useState(0);

  // Animation configuration following Emil's principles - using proper Framer Motion easing
  const easing = shouldReduceMotion ? "linear" : "easeOut";
  const duration = shouldReduceMotion ? 0.3 : 2.5;

  // HyperText animation logic
  useEffect(() => {
    const newTargetText = isAnimating ? "PROCESSING" : "READY";
    if (newTargetText !== targetText) {
      setTargetText(newTargetText);
      setTextIterations(0);
      setIsTextAnimating(true);
    }
  }, [isAnimating, targetText]);

  useEffect(() => {
    if (!isTextAnimating) return;

    const interval = setInterval(() => {
      if (textIterations < targetText.length) {
        setDisplayText((prev) =>
          targetText.split("").map((l, i) =>
            l === " "
              ? l
              : i <= textIterations
                ? targetText[i]
                : alphabets[getRandomInt(26)],
          ),
        );
        setTextIterations((prev) => prev + 0.1);
      } else {
        setIsTextAnimating(false);
        setDisplayText(targetText.split(""));
        clearInterval(interval);
      }
    }, 800 / (targetText.length * 10));

    return () => clearInterval(interval);
  }, [isTextAnimating, targetText, textIterations]);

  // Fix React setState error by using useEffect to call onAnimationComplete
  useEffect(() => {
    if (animatedProgress >= 100 && isAnimating) {
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [animatedProgress, isAnimating, onAnimationComplete]);

  useEffect(() => {
    if (totalRecords !== undefined) {
      // Prop-driven progress only
      const progress = totalRecords > 0 ? (processedRecords / totalRecords) * 100 : 0;
      setAnimatedProgress(progress);
      setFilesCount(processedRecords);
      const remaining = totalRecords - processedRecords;
      setTimeRemainingSeconds(Math.ceil(remaining * 1.1)); // 1.1s per record approx

      if (progress >= 100 && totalRecords > 0) {
         // Use a reference check to prevent loops
         const timer = setTimeout(() => {
           onAnimationComplete?.();
         }, 800);
         return () => clearTimeout(timer);
      }
    } else {
      setAnimatedProgress(0);
      setFilesCount(0);
      setTimeRemainingSeconds(0);
    }
  }, [totalRecords, processedRecords, onAnimationComplete]);

  // Format time from seconds to "Xmin XXsec"
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}min ${remainingSeconds.toString().padStart(2, "0")}sec`;
  };

  // Motion variants following Emil's interruptible animations principle
  const containerVariants: any = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
      transition: { duration: 0.2, ease: easing },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: easing },
    },
  };

  // Updated chevron animation - simple smooth up and down motion
  const chevronVariants: any = {
    idle: { y: 0, opacity: 0.7 },
    animating: {
      y: shouldReduceMotion ? 0 : [0, 8, 0], // Smooth up and down oscillation, lower range
      opacity: shouldReduceMotion ? 0.7 : [0.7, .9, .7], // High at peak, fade out as it comes back up
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: isAnimating ? Infinity : 0,
        repeatType: "loop" as const,
      },
    },
  };

  const chevron2Variants: any = {
    idle: { y: 14, opacity: 0.5 }, // Slightly below first chevron
    animating: {
      y: shouldReduceMotion ? 8 : [14, 18, 14], // Smooth up and down oscillation, lower range
      opacity: shouldReduceMotion ? 0.5 : [0.5, 1, 0.5], // Start low, peak when first chevron fades, then back to medium
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: isAnimating ? Infinity : 0,
        repeatType: "loop" as const,
        delay: 0.15, // Delay start slightly
      },
    },
  };

  // Sequential dots animation - appear 1,2,3 then disappear 1,2,3
  const dotsVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const dotVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: easing,
      },
    },
  };

  return (
    <motion.div
      className={`w-full max-w-lg ${className || ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top header row */}
      <div className="flex items-center mb-2">
        {/* Animated ChevronDown icons - pulsing up and down */}
        <div
          className={cn(
            "flex -mt-3 flex-col items-center justify-center w-8 h-16 overflow-hidden relative"
          )}
        >
          <motion.div
            className="absolute"
            variants={chevronVariants}
            animate={isAnimating ? "animating" : "idle"}
          >
            <ChevronDown size={24} className="text-white" />
          </motion.div>
          <motion.div
            className="absolute"
            variants={chevron2Variants}
            animate={isAnimating ? "animating" : "idle"}
          >
            <ChevronDown size={24} className="text-white" />
          </motion.div>
        </div>

        {/* DOWNLOADING/READY banner - using inline HyperText animation */}
        <div className="relative ml-2 flex-1 max-w-xs">
          <svg
            width="50%"
            height="32"
            viewBox="0 0 107 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-1/2 left-0 transform -translate-y-1/2 w-1/2 fill-white"
            preserveAspectRatio="none"
          >
            <path
              d="M0.445312 0.5H106.103V8.017L99.2813 14.838H0.445312V0.5Z"
            />
          </svg>
          <div className="relative px-4 py-1.5 font-mono font-bold text-sm text-black">
            <div className="flex items-center">
              <div className="flex font-mono font-bold text-black">
                {displayText.map((letter, i) => (
                  <motion.span
                    key={`${targetText}-${i}`}
                    className={cn("font-mono text-black font-bold", letter === " " ? "w-3" : "")}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 3 }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
              {isAnimating && (
                <motion.div
                  className="ml-1 flex text-black"
                  variants={dotsVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.span variants={dotVariants}>.</motion.span>
                  <motion.span variants={dotVariants}>.</motion.span>
                  <motion.span variants={dotVariants}>.</motion.span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thick separator bar */}
      <div className="w-full h-1 bg-white mb-3 rounded-full" />

      {/* Labels row */}
      <div className="flex items-center mb-1 text-white">
        <div className="w-32">
          <div className="text-xs font-mono">PROGRESS</div>
        </div>

        <div className="flex ml-6">
          <div className="w-28 text-left">
            <div className="text-xs font-mono">EST. TIME</div>
          </div>
          <div className="w-28 text-left">
            <div className="text-xs font-mono">RECORDS CHK:</div>
          </div>
        </div>
      </div>

      {/* Values row - progress bar and info values */}
      <div className="flex items-center text-white">
        {/* Animated Progress bar */}
        <div className="w-32">
          <div className="w-full h-2.5 border border-white bg-transparent rounded-full flex items-center px-0.5">
            <motion.div
              className="h-1 bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${animatedProgress}%`,
              }}
              transition={{
                duration: shouldReduceMotion ? 0.1 : 0.3,
                ease: easing,
              }}
            />
          </div>
        </div>

        {/* Animated info values */}
        <div className="flex ml-6">
          <div className="w-28 text-left">
            <div className="text-sm font-mono text-white">
              {formatTime(timeRemainingSeconds)}
            </div>
          </div>
          <div className="w-28 text-left">
            <div className="text-sm font-mono text-white">
              {filesCount.toLocaleString()} {totalRecords ? `/ ${totalRecords.toLocaleString()}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Static bottom bar - always visible */}
      <div className="w-3/4 h-0.5 bg-[var(--color-brand-violet)] mt-4 rounded-full" />
    </motion.div>
  );
}
