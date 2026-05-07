import { motion } from "framer-motion";
import { Globe } from "lucide-react";

const ModernLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d2b6b] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b6b] to-[#0a1f5c]" />
      
      {/* Animated Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]"
      />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with Pulse */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-[#0a1f5c] rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 mb-8"
        >
          <Globe className="text-white w-12 h-12" />
        </motion.div>

        {/* Loading Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden relative border border-white/5">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>

        {/* Text Fade */}
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]"
        >
          Securing Connection
        </motion.p>
      </div>

      {/* Decorative Circles */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[400px] h-[400px] border border-white/10 rounded-full animate-ping duration-[3000ms]" />
        <div className="absolute w-[600px] h-[600px] border border-white/5 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default ModernLoader;
