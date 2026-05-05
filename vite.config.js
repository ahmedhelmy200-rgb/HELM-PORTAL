import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''
  return {
  define: {
    'process.env.API_KEY': JSON.stringify(geminiApiKey),
    'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
  },
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core' : ['react', 'react-dom', 'react-router-dom'],
          'charts'     : ['recharts'],
          'stripe'     : ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'supabase'   : ['@supabase/supabase-js'],
          'dates'      : ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'date-fns', 'recharts'],
  },
}
})
