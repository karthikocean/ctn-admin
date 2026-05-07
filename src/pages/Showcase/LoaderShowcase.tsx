import React, { useState } from "react";
import { motion } from "framer-motion";
import PremiumLoader from "@/components/common/PremiumLoader";
import { Button } from "@/components/ui/button";

const LoaderShowcase = () => {
  const [activeLoader, setActiveLoader] = useState<"network" | "tech-circle" | "pulse">("network");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const triggerFullscreen = () => {
    setIsFullscreen(true);
    setTimeout(() => setIsFullscreen(false), 3000);
  };

  return (
    <div className="page-container bg-slate-950 min-h-screen text-white p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Premium System Loaders
          </h1>
          <p className="text-slate-400 max-w-2xl">
            A collection of high-fidelity, networking-inspired loading animations built with Framer Motion and Tailwind CSS.
          </p>
        </div>

        {/* Fullscreen Trigger */}
        <div className="glass-card p-8 border-blue-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Page Transition</h3>
            <p className="text-sm text-slate-500">Test the immersive fullscreen loading experience.</p>
          </div>
          <Button 
            onClick={triggerFullscreen}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8"
          >
            Trigger Fullscreen
          </Button>
        </div>

        {isFullscreen && (
          <PremiumLoader variant="fullscreen" style={activeLoader} text="Syncing Global Infrastructure..." />
        )}

        {/* Style Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Network Style */}
          <motion.div 
            whileHover={{ y: -5 }}
            className={`glass-card p-8 border-2 transition-all cursor-pointer ${activeLoader === 'network' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
            onClick={() => setActiveLoader('network')}
          >
            <div className="h-48 flex items-center justify-center mb-6">
              <PremiumLoader style="network" variant="centered" text="" />
            </div>
            <h4 className="text-center font-bold mb-2">Network Nodes</h4>
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest">Connection & Data Flow</p>
          </motion.div>

          {/* Tech Circle Style */}
          <motion.div 
            whileHover={{ y: -5 }}
            className={`glass-card p-8 border-2 transition-all cursor-pointer ${activeLoader === 'tech-circle' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
            onClick={() => setActiveLoader('tech-circle')}
          >
            <div className="h-48 flex items-center justify-center mb-6">
              <PremiumLoader style="tech-circle" variant="centered" text="" />
            </div>
            <h4 className="text-center font-bold mb-2">Tech Circle</h4>
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest">System Processing</p>
          </motion.div>

          {/* Pulse Dots Style */}
          <motion.div 
            whileHover={{ y: -5 }}
            className={`glass-card p-8 border-2 transition-all cursor-pointer ${activeLoader === 'pulse' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
            onClick={() => setActiveLoader('pulse')}
          >
            <div className="h-48 flex items-center justify-center mb-6">
              <PremiumLoader style="pulse" variant="centered" text="" />
            </div>
            <h4 className="text-center font-bold mb-2">Minimal Pulse</h4>
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest">Status Awareness</p>
          </motion.div>
        </div>

        {/* Code Usage Section */}
        <div className="glass-card p-8 border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            Quick Implementation
          </h3>
          <div className="bg-black/40 rounded-2xl p-6 font-mono text-sm border border-white/5 text-blue-300">
            <pre>{`// Usage Example
<PremiumLoader 
  variant="fullscreen" 
  style="network" 
  text="Connecting to Node..." 
/>`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderShowcase;
