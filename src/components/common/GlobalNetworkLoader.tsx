import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalNetworkLoaderProps {
  fullScreen?: boolean;
  size?: "sm" | "lg";
  title?: string;
  subtitle?: string;
  className?: string;
}

const GlobalNetworkLoader: React.FC<GlobalNetworkLoaderProps> = ({
  fullScreen = true,
  size = "lg",
  title = "Connecting to Global Network...",
  subtitle = "Establishing secure connection to global nodes",
  className,
}) => {
  const isSmall = size === "sm";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-700 overflow-hidden",
          fullScreen 
            ? "fixed inset-0 z-[9999] bg-[#020d20]/95 backdrop-blur-md" 
            : "fixed top-0 bottom-0 right-0 z-50 bg-[#020d20]/90 backdrop-blur-md",
          className
        )}
        style={!fullScreen ? { left: 'var(--sidebar-width, 260px)' } : {}}
      >
        {/* Background Enhancements - Immersive Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/[0.03]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative flex flex-col items-center justify-center z-10 w-full h-full">

          {/* Refined "The Sync Orb" - Compact and Elegant */}
          <div className={cn(
            "relative flex items-center justify-center mb-8",
            isSmall ? "w-16 h-16" : "w-28 h-28"
          )}>

            {/* Fine Scanning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[1.5px] border-transparent border-t-blue-500 rounded-full opacity-60"
            />

            {/* Outer Static Faint Ring */}
            <div className="absolute inset-0 border border-blue-500/10 rounded-full" />

            {/* Micro Orbiting Nodes */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div
                  className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                  style={{ top: '0', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              </motion.div>
            ))}

            {/* Central Globe Core - More compact */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "relative z-10 flex items-center justify-center bg-slate-900 border border-blue-500/30 rounded-full shadow-2xl shadow-blue-500/10",
                isSmall ? "w-8 h-8" : "w-14 h-14"
              )}
            >
              <Globe className={cn("text-blue-400", isSmall ? "w-4 h-4" : "w-7 h-7")} />

              {/* Subtle Internal Pulse */}
              <motion.div
                animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/30 rounded-full"
              />
            </motion.div>
          </div>

          {/* REFINED THREE DOTS BELOW */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
              />
            ))}
          </div>

          {/* Minimal Typography */}
          {!isSmall && (
            <div className="mt-8 text-center space-y-1.5 relative z-10">
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                {title}
              </h3>
              <p className="text-blue-400/60 text-[9px] font-bold uppercase tracking-[0.3em]">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalNetworkLoader;
