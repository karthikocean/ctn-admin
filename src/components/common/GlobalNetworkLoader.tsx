import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Share2 } from "lucide-react";
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
  title = "Syncing Network Data...",
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
          "flex flex-col items-center justify-center transition-all duration-700",
          fullScreen ? "fixed inset-0 z-[9999] bg-[#020617]" : "w-full h-full min-h-[400px]",
          className
        )}
      >
        {/* Background Radial Glow */}
        {fullScreen && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px]" />
          </div>
        )}

        <div className="relative flex items-center justify-center">
          {/* Ripple Waves */}
          {!isSmall && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`wave-${i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: [0, 0.15, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.3,
                    ease: "easeOut",
                  }}
                  className="absolute w-32 h-32 border border-blue-500/30 rounded-full"
                />
              ))}
            </>
          )}

          {/* Central Node */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 40px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "relative z-20 bg-[#0f172a] border border-blue-500/30 rounded-[1.5rem] flex items-center justify-center",
              isSmall ? "w-10 h-10 rounded-xl" : "w-24 h-24"
            )}
          >
            <Network className={cn("text-blue-400", isSmall ? "w-5 h-5" : "w-10 h-10")} />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-blue-500/5 rounded-[1.5rem] animate-pulse" />
          </motion.div>

          {/* Orbiting Nodes & Lines */}
          {!isSmall && (
            <div className="absolute inset-0 w-64 h-64 -left-20 -top-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                    <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                  </linearGradient>
                </defs>

                {/* Data Flow Lines */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60 * Math.PI) / 180;
                  const x2 = 100 + 70 * Math.cos(angle);
                  const y2 = 100 + 70 * Math.sin(angle);
                  return (
                    <motion.line
                      key={`line-${i}`}
                      x1="100"
                      y1="100"
                      x2={x2}
                      y2={y2}
                      stroke="url(#lineGradient)"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: [0, 1, 0], 
                        opacity: [0, 1, 0],
                        x2: [100, x2, 100],
                        y2: [100, y2, 100]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}

                {/* Orbiting Dots */}
                {[...Array(4)].map((_, i) => (
                  <motion.circle
                    key={`dot-${i}`}
                    r="3"
                    className="fill-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                    animate={{
                      cx: [
                        100 + (60 + i * 10) * Math.cos(0),
                        100 + (60 + i * 10) * Math.cos(2 * Math.PI),
                      ],
                      cy: [
                        100 + (60 + i * 10) * Math.sin(0),
                        100 + (60 + i * 10) * Math.sin(2 * Math.PI),
                      ],
                    }}
                    transition={{
                      duration: 10 + i * 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Text Content */}
        {!isSmall && (
          <div className="mt-12 text-center relative z-10">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl font-bold text-white tracking-tight"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {title}
              </motion.span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-2 text-blue-200/40 text-xs font-medium uppercase tracking-[0.3em]"
            >
              {subtitle}
            </motion.p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalNetworkLoader;
