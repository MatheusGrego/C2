import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],

  define: {
    // Polyfill para 'global' no navegador (necessário para sockjs-client)
    global: 'window',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws-dashboard': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
})
