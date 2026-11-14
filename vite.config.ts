import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import type { ProxyOptions } from 'vite'

const backendProxy: Record<string, ProxyOptions> = {
  '/moa-api': {
    target: process.env.MOA_BACKEND_TARGET || 'https://moa-backend-b68k.onrender.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/moa-api/, ''),
    configure: (proxy) => { proxy.on('proxyReq', (request) => request.removeHeader('origin')) },
  },
}

// https://vite.dev/config/
export default defineConfig({
  server: { proxy: backendProxy },
  preview: { proxy: backendProxy },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
