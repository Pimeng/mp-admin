import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分包策略 - 简单策略：只分割项目代码，第三方依赖打包在一起
        manualChunks(id: string) {
          // 所有 node_modules 打包到一个 vendor chunk
          if (id.includes('node_modules') || id.includes('.pnpm')) {
            return 'vendor';
          }
          // 项目代码按功能模块分割
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          if (id.includes('/src/sections/')) {
            return 'sections';
          }
          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('/src/components/')) {
            return 'components';
          }
        },
        // 控制 chunk 文件大小和命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || ''
          if (info.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(info)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(info)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // 控制 chunk 大小警告阈值 (单位: KB)
    chunkSizeWarningLimit: 1000,
    // 启用压缩（使用 esbuild，Vite 默认）
    minify: 'esbuild',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map（生产环境可关闭）
    sourcemap: false,
  },
});
