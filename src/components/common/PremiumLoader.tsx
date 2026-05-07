import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumLoaderProps {
  variant?: "fullscreen" | "centered" | "small";
  style?: "network" | "tech-circle" | "pulse";
  text?: string;
  className?: string;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  variant = "centered",
  style = "network",
  text = "Loading System...",
  className,
}) => {
  const containerClasses = cn(
    "flex flex-col items-center justify-center transition-all duration-500",
    {
      "fixed inset-0 z-[9999] bg-[#020617]": variant === "fullscreen",
      "w-full h-full min-h-[300px]": variant === "centered",
      "w-fit h-fit p-1": variant === "small",
    },
    className
  );

  return (
    <div className={containerClasses}>
      {variant === "fullscreen" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>
      )}

      <div className="relative z-10">
        {style === "network" && <NetworkLoader size={variant === "small" ? "sm" : "lg"} />}
        {style === "tech-circle" && <TechCircleLoader size={variant === "small" ? "sm" : "lg"} />}
        {style === "pulse" && <PulseDotsLoader size={variant === "small" ? "sm" : "lg"} />}
      </div>

      {text && variant !== "small" && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-blue-100/40 text-[10px] font-bold uppercase tracking-[0.4em] text-center"
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {text}
          </motion.span>
        </motion.p>
      )}
    </div>
  );
};

/* --- Network Nodes Style --- */
const NetworkLoader = ({ size }: { size: "sm" | "lg" }) => {
  const nodeCount = 5;
  const radius = size === "lg" ? 40 : 12;

  return (
    <div className={cn("relative", size === "lg" ? "w-32 h-32" : "w-8 h-8")}>
      {/* Background Pulse */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
      />

      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Connecting Lines */}
        {[...Array(nodeCount)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1="50"
            y1="50"
            x2={50 + radius * Math.cos((i * 2 * Math.PI) / nodeCount)}
            y2={50 + radius * Math.sin((i * 2 * Math.PI) / nodeCount)}
            stroke="currentColor"
            className="text-blue-500/30"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.5, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Orbiting Nodes */}
        {[...Array(nodeCount)].map((_, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={50 + radius * Math.cos((i * 2 * Math.PI) / nodeCount)}
            cy={50 + radius * Math.sin((i * 2 * Math.PI) / nodeCount)}
            r={size === "lg" ? 2.5 : 1.5}
            className="fill-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Central Node */}
        <motion.circle
          cx="50"
          cy="50"
          r={size === "lg" ? 4 : 2}
          className="fill-blue-500 shadow-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

/* --- Tech Circle Style --- */
const TechCircleLoader = ({ size }: { size: "sm" | "lg" }) => {
  return (
    <div className={cn("relative flex items-center justify-center", size === "lg" ? "w-32 h-32" : "w-8 h-8")}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute border-t-2 border-r-2 border-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,0.3)]",
          size === "lg" ? "w-24 h-24" : "w-6 h-6"
        )}
      />
      <motion.div
        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("bg-blue-500/20 rounded-full blur-md", size === "lg" ? "w-12 h-12" : "w-3 h-3")}
      />
    </div>
  );
};

/* --- Pulse Dots Style --- */
const PulseDotsLoader = ({ size }: { size: "sm" | "lg" }) => {
  return (
    <div className="flex items-center gap-2">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
            backgroundColor: ["#3b82f6", "#60a5fa", "#3b82f6"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className={cn("rounded-full shadow-sm", size === "lg" ? "w-4 h-4" : "w-1.5 h-1.5")}
        />
      ))}
    </div>
  );
};

export default PremiumLoader;
