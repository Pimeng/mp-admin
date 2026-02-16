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
        // 手动分包策略 - 使用函数形式更智能地分割
        manualChunks(id: string) {
          // React 核心库
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // Radix UI 组件库
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          // 图表库
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // 表单相关
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          // 工具库
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/class-variance-authority')) {
            return 'vendor-utils';
          }
          // 其他 node_modules 按包名分组
          if (id.includes('node_modules')) {
            // 提取包名
            const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (match) {
              const packageName = match[1];
              // 将大型依赖单独打包，其他按 vendor-其他 分组
              const largePackages = ['lucide-react', 'cmdk', 'vaul', 'embla-carousel-react', 'react-day-picker'];
              if (largePackages.some(pkg => packageName?.includes(pkg))) {
                return `vendor-${packageName?.replace('@', '').replace('/', '-')}`;
              }
              return 'vendor-others';
            }
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
    chunkSizeWarningLimit: 500,
    // 启用压缩（使用 esbuild，Vite 默认）
    minify: 'esbuild',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 source map（生产环境可关闭）
    sourcemap: false,
  },
});
