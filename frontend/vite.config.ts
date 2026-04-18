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
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    }
  }
});
