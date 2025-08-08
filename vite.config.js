import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cambia "kev-k/react-pdf-products" por tu repo (usuario/nombre)
const base = '/react-pdf-products/'

export default defineConfig({
  plugins: [react()],
  base // necesario para GitHub Pages (si usas repo de usuario, puedes dejar '/')
})
