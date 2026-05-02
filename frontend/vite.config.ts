import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules/react-router-dom")) return "vendor";
          if (id.includes("node_modules/react-dom"))        return "vendor";
          if (id.includes("node_modules/react/"))           return "vendor";
          if (id.includes("node_modules/recharts"))         return "charts";
          if (id.includes("node_modules/framer-motion"))    return "motion";
          if (id.includes("node_modules/axios"))            return "http";
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
