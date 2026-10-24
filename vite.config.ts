import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const page = (name: string) => fileURLToPath(new URL(name, import.meta.url))

export default defineConfig({
  // GitHub Pages sirve el repo como subruta (/MindStudy/). En local y en otros
  // hostings la raíz es '/'. Sin esto, los assets dan 404 al desplegar.
  base: process.env.GITHUB_ACTIONS ? '/MindStudy/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: false },
  build: {
    rollupOptions: {
      // Sitio multipágina: cada sección es un documento HTML independiente.
      input: {
        dashboard: page('index.html'),
        focus: page('enfoque.html'),
        music: page('musica.html'),
        planner: page('planificador.html'),
        calculator: page('calculadora.html'),
        cards: page('tarjetas.html'),
        garden: page('jardin.html'),
        contact: page('contacto.html'),
      },
    },
  },
})
