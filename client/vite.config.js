import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': loadEnv(mode, process.cwd(), '').BACKEND_TARGET || 'http://127.0.0.1:7050',
      '/public': loadEnv(mode, process.cwd(), '').BACKEND_TARGET || 'http://127.0.0.1:7050',
    },
  }
}))
