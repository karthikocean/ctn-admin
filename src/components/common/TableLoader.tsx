import React from "react";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableLoaderProps {
  text?: string;
  className?: string;
}

export const TableLoader: React.FC<TableLoaderProps> = ({
  text = "Syncing categories...",
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] transition-all duration-300 rounded-xl",
        className
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Networking Loader Core */}
        <div className="relative flex items-center justify-center w-16 h-16">
          {/* Pulse Effect */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/20 rounded-full"
          />
          
          {/* Central Node */}
          <div className="relative z-10 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary animate-pulse" />
          </div>

          {/* Animated Dots (Data Flow) */}
          <div className="absolute w-full h-full">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  x: [0, 20 * Math.cos((i * 90 * Math.PI) / 180)],
                  y: [0, 20 * Math.sin((i * 90 * Math.PI) / 180)],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-primary/40"
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex flex-col items-center gap-1"
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">
            {text}
          </span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 rounded-full bg-primary/40"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 6,
  columns = 5,
  className,
}) => {
  return (
    <div className={cn("w-full space-y-4 p-4", className)}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-50 dark:bg-slate-900/50 rounded animate-pulse w-1/2" />
          </div>
          {[...Array(columns - 1)].map((_, j) => (
            <div key={j} className="hidden sm:block h-8 w-24 bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
};
