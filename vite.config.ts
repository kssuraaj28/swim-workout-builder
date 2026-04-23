import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so the built site works at any URL path (root, subfolder, etc.)
  // TODO: Is this okay?
  //base: './',
})
