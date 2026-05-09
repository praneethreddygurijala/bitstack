import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/discover': {
          target: 'https://serpapi.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const q = url.searchParams.get('q');
            const engine = url.searchParams.get('engine') || 'google_local';
            return `/search.json?engine=${engine}&q=${encodeURIComponent(q || '')}&api_key=${env.VITE_SERPAPI_KEY}`;
          }
        }
      }
    }
  }
})
