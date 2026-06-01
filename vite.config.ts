import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('katex')) return 'katex';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'recharts';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('/react') || id.includes('react-dom') || id.includes('scheduler')) return 'react';
        },
      },
    },
  },
})
