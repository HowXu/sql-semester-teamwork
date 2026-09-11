import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/react-router/") || id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-tanstack";
          }
          if (
            id.includes("node_modules/lucide-react/") ||
            id.includes("node_modules/clsx/") ||
            id.includes("node_modules/tailwind-merge/") ||
            id.includes("node_modules/class-variance-authority/") ||
            id.includes("node_modules/zustand/")
          ) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/motion/")) {
            return "vendor-motion";
          }
          return undefined;
        },
      },
    },
  },
});
