import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    // 1. TanStack Router ОБЯЗАТЕЛЬНО идет первым (до react)
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routes/routeTree.gen.ts',
    }),
    // 2. Затем плагин React
    react(),
    // 3. Плагин Tailwind
    tailwindcss(),
  ],
  resolve: {
    // 4. Встроенная поддержка tsconfig paths (заменяет vite-tsconfig-paths)
    tsconfigPaths: true,
  },
  // 🔽 ДОБАВЛЯЕМ СЕКЦИЮ SERVER ДЛЯ ПРОКСИРОВАНИЯ R2
  server: {
    proxy: {
      '/r2-proxy': {
        target: 'https://pub-3387ec0d355d404daf0dcee5485caf3e.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ''),
      },
    },
  },
})