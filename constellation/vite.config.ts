import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/constellation/',
  build: {
    outDir: '../constellation-dist',
    emptyOutDir: true,
  },
})
