import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const acrHost = env.VITE_ACR_HOST

  return {
    plugins: [react()],
    server: {
      proxy: acrHost
        ? {
            '/acr-proxy': {
              target: `https://${acrHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/acr-proxy/, ''),
            },
          }
        : undefined,
    },
  }
})
