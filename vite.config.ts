import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages sirve el repo como subruta (/MindStudy/). En local y en otros
  // hostings la raíz es '/'. Sin esto, los assets dan 404 al desplegar.
  base: process.env.GITHUB_ACTIONS ? '/MindStudy/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: false },
})
