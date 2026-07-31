import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDesktopBuild = mode === 'desktop'
  const enableOfflineSync = isDesktopBuild && env.VITE_DESKTOP_OFFLINE_SYNC === 'true'

  const alias = [
    ...(enableOfflineSync
      ? [
          {
            find: '@/components/app/AppStatusBar',
            replacement: fileURLToPath(new URL('./src/desktop/DesktopAwareStatusBar.jsx', import.meta.url)),
          },
          {
            find: '@/api/base44Client',
            replacement: fileURLToPath(new URL('./src/desktop/base44DesktopClient.js', import.meta.url)),
          },
          {
            find: '@/integrations/supabase/client',
            replacement: fileURLToPath(new URL('./src/desktop/supabaseDesktopClient.js', import.meta.url)),
          },
        ]
      : []),
    {
      find: '@',
      replacement: fileURLToPath(new URL('./src', import.meta.url)),
    },
  ]

  return {
    base: isDesktopBuild ? './' : '/',
    resolve: { alias },
    define: {
      __HELM_DESKTOP_OFFLINE_SYNC__: JSON.stringify(enableOfflineSync),
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    plugins: [react()],
    build: {
      target: 'es2015',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-core': ['react', 'react-dom', 'react-router-dom'],
            'charts': ['recharts'],
            'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            'supabase': ['@supabase/supabase-js'],
            'dates': ['date-fns'],
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
