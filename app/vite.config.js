import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4151,
    strictPort: true,   // fail if 4151 is busy instead of auto-picking another
    host: true,
  },
})
