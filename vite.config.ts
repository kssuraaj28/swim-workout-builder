import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so the built site works at any URL path (root, subfolder, etc.)
  // without knowing its mount point at build time.
  //
  // Downsides to be aware of:
  //   - Client-side routing (React Router / History API) breaks on deep-link reloads:
  //     relative paths resolve against the current URL, not the app root, so assets 404.
  //   - Absolute public-folder references like `<img src="/logo.png">` or
  //     `fetch("/data.json")` won't work; use relative paths or imports instead.
  //   - `import.meta.env.BASE_URL` is `./`, awkward if needed as a router basename.
  //
  // Fine for a simple SPA with no routing. Switch to an absolute `base` if that changes.
  base: './',
})
