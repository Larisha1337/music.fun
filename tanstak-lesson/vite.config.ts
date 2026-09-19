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
})