import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site from /<repo>/, so assets need that prefix.
  // Set explicitly by the deploy workflow; '/' keeps dev, preview and local
  // builds at the root. Reproduce a deploy build with:
  //   VITE_BASE=/cpuinstr/ npm run build
  base: process.env.VITE_BASE ?? '/',
  test: { environment: 'node', globals: true },
})
