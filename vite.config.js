import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const acrHost = env.VITE_ACR_HOST
  const acrScheme = (env.VITE_ACR_SCHEME || 'http').toLowerCase() === 'https' ? 'https' : 'http'

  const normalizedAcrHost = acrHost?.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: normalizedAcrHost
        ? {
            '/acr-proxy': {
              target: `${acrScheme}://${normalizedAcrHost}`,
              changeOrigin: true,
              secure: acrScheme === 'https',
              rewrite: (path) => path.replace(/^\/acr-proxy/, ''),
            },
          }
        : undefined,
    },
  }
})
