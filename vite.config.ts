import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  // 🔥 IMPORTANT: ADD THIS
  build: {
    chunkSizeWarningLimit: 800, // reduce warning noise (optional)

    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          react: ["react", "react-dom"],

          // Router
          router: ["react-router-dom"],

          // Query
          query: ["@tanstack/react-query"],

          // UI libs (adjust based on your project)
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],

          // Utils
          vendor: ["axios"],
        },
      },
    },
  },
}));