# Phira API 管理面板 (mp-admin)

[![Version](https://img.shields.io/badge/version-1.6.1-blue)](./package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

> 一个面向 [Phira](https://phira.moe) 音游多人联机服务的 Web 管理面板，兼容 `tphira-mp` API 格式。提供房间查询、实时状态监控、回放查看以及完整的后台管理功能。

## 功能特性

### 双模式设计

| 模式 | 功能 |
|------|------|
| **玩家模式** | 房间列表查询、房间详情查看、实时 WebSocket 状态推送、游戏回放、成绩记录查看 |
| **管理员模式** | 房间管理（踢人、解散、修改设置）、用户管理、消息管理、比赛管理、系统设置、实时日志监控 |

### 核心功能

- **实时数据**: 通过 WebSocket 订阅房间状态更新，支持心跳检测和自动重连
- **灵活配置**: 支持通过 URL 参数或本地存储配置 API 后端地址
- **安全鉴权**: 
  - 管理员 Token 鉴权（Header/Query 参数）
  - OTP 一次性验证码登录
  - CLI 审批模式（服务器终端人工批准）
- **主题切换**: 支持深色/浅色/跟随系统三种主题模式
- **响应式布局**: 适配桌面端和移动端
- **数据可视化**: 使用 Recharts 展示统计图表
- **分析统计**: 内置 Microsoft Clarity 和 Umami 用户行为分析

## 技术栈

| 类别 | 技术选型 |
|------|----------|
| 框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 路由 | react-router-dom v7 |
| 样式 | Tailwind CSS 3 + CSS 变量 |
| UI 组件 | Radix UI（shadcn/ui 风格）|
| 表单 | react-hook-form + zod |
| 图表 | recharts |
| 日期处理 | date-fns |
| 图标 | lucide-react |
| 通知 | sonner |
| 弹窗 | sweetalert2 |
| 主题 | next-themes |

## 项目结构

```
mp-admin/
├── public/                      # 静态资源
│   ├── icon.png                 # 网站图标
│   └── changelog.json           # 构建时生成的提交历史
├── scripts/
│   └── generate-changelog.js   # 构建脚本：生成 changelog.json
├── src/
│   ├── components/              # UI 组件
│   │   ├── ui/                  # shadcn/ui 基础组件（Button, Dialog, Table 等）
│   │   ├── theme-provider.tsx   # 主题上下文提供者
│   │   ├── theme-toggle.tsx     # 主题切换按钮
│   │   ├── ConfigDialog.tsx     # API 配置对话框
│   │   ├── LoginDialog.tsx      # Phira 账号登录对话框
│   │   ├── AdminTokenDialog.tsx # 管理员 Token 设置对话框
│   │   ├── UserMenu.tsx         # 用户菜单（登出/切换账号）
│   │   ├── ConnectionStatus.tsx # WebSocket 连接状态指示器
│   │   └── ...
│   ├── pages/                   # 页面级组件
│   │   ├── ModeSelectPage.tsx   # 模式选择页（玩家/管理员）
│   │   ├── RoomDetailPage.tsx   # 房间详情页（需登录）
│   │   └── PublicRoomDetailPage.tsx # 公开房间详情页
│   ├── sections/                # 功能区块
│   │   ├── RoomQueryPanel.tsx   # 房间查询面板
│   │   ├── ReplayPanel.tsx      # 回放查看面板
│   │   ├── AdminApiPanel.tsx    # 管理员 API 面板
│   │   └── ConfigPanel.tsx      # 配置面板
│   ├── services/                # API 服务
│   │   ├── api.ts               # 后端 HTTP API 服务
│   │   ├── websocket.ts         # WebSocket 服务
│   │   └── phiraApi.ts          # Phira 官方 API 服务
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useApiConfig.ts      # API 配置管理
│   │   └── useUrlConfig.ts      # URL 参数配置解析
│   ├── lib/                     # 工具函数
│   │   ├── utils.ts             # 通用工具函数
│   │   └── app-mode.ts          # 应用模式管理
│   ├── types/                   # TypeScript 类型定义
│   ├── App.tsx                  # 根组件（路由配置）
│   ├── main.tsx                 # 应用入口
│   └── index.css                # 全局样式 + Tailwind 指令
├── api.md                       # 后端 HTTP API 文档
├── websocket.md                 # WebSocket API 文档
├── vite.config.ts               # Vite 配置（含 Git 提交历史注入）
├── tailwind.config.js           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置（项目引用）
└── package.json
```

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18 或更高版本
- [pnpm](https://pnpm.io/)（推荐）或 npm/yarn

### 安装依赖

```bash
pnpm install
```

### 开发服务器

```bash
pnpm dev
```

启动后访问 `http://localhost:5173`（Vite 默认端口）。

### 构建生产版本

```bash
pnpm build
```

构建脚本会：
1. 运行 `scripts/generate-changelog.js` 生成 `public/changelog.json`
2. 执行 TypeScript 编译检查
3. 使用 Vite 构建并输出到 `dist/` 目录

### 预览生产构建

```bash
pnpm preview
```

## 配置说明

### API 后端地址

首次使用时需要配置后端 API 地址：

1. **手动配置**: 点击顶部导航栏的「设置」图标，输入后端 HTTP 服务地址（如 `http://localhost:12347`）
2. **URL 参数配置**: 通过 `?api=xxx` 参数自动配置，例如：
   ```
   http://your-domain.com/?api=http://localhost:12347
   ```

配置会自动保存到浏览器的 `localStorage` 中，下次访问自动恢复。

### 管理员鉴权

管理员模式需要有效的管理员 Token。获取方式：

- **直接配置**: 如果后端配置了 `ADMIN_TOKEN`，在设置中输入即可
- **OTP 验证码**: 后端未配置 `ADMIN_TOKEN` 时，通过终端显示的验证码获取临时 Token（有效期约 1 分钟）
- **CLI 审批**: 向服务器管理员申请，通过终端命令 `approve <ssid>` 批准后获取临时 Token

更多鉴权细节请参阅 [api.md](./api.md)。

## 开发指南

### 路由结构

| 路径 | 说明 | 权限 |
|------|------|------|
| `/` | 模式选择页（玩家/管理员） | 无 |
| `/player` | 玩家模式主页（房间查询 + 回放） | 无 |
| `/player/room/:roomId` | 公开房间详情 | 无 |
| `/admin` | 管理员模式主页 | 需管理员 Token |
| `/admin/room/:roomId` | 房间管理详情 | 需管理员 Token + 玩家登录 |

### 状态管理

本项目未使用全局状态管理库（如 Redux/Zustand），状态管理策略如下：

- **本地状态**: React `useState` / `useReducer`
- **服务端状态**: 直接调用 API 服务层，配合 `useEffect` 获取数据
- **持久化配置**: `localStorage`（API 地址、用户 Token、主题设置、上次选择的模式）
- **共享状态**: React Context（仅 ThemeProvider）

### 主题系统

基于 `next-themes` 和 CSS 变量实现：

```tsx
// 主题切换
<ThemeProvider defaultTheme="system" storageKey="mp-admin-theme">
  <App />
</ThemeProvider>
```

- `dark` - 深色模式
- `light` - 浅色模式
- `system` - 跟随系统偏好

主题变量定义在 `src/index.css` 中，使用 HSL 颜色格式。

### WebSocket 实时通信

WebSocket 服务封装在 `src/services/websocket.ts`，支持：

```typescript
// 订阅房间更新
ws.send(JSON.stringify({
  type: 'subscribe',
  roomId: 'room-id',
  userId: 123  // 可选
}));

// 心跳检测
ws.send(JSON.stringify({ type: 'ping' }));
```

连接状态通过 `ConnectionStatus` 组件可视化展示。

详细协议请参阅 [websocket.md](./websocket.md)。

### 组件开发规范

本项目使用 **shadcn/ui** 风格的组件体系：

1. **基础组件**位于 `src/components/ui/`，基于 Radix UI + Tailwind CSS
2. **业务组件**位于 `src/components/`，组合基础组件实现特定功能
3. **页面组件**位于 `src/pages/`，负责路由级别的页面组装
4. **功能区块**位于 `src/sections/`，是可复用的页面模块

组件示例：

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>标题</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>操作</Button>
      </CardContent>
    </Card>
  );
}
```

### 表单处理

使用 `react-hook-form` + `zod` 进行类型安全的表单验证：

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## 构建配置

### Vite 配置亮点

- **路径别名**: `@/` 映射到 `./src/`
- **代码分割**: 
  - `vendor` - 第三方依赖
  - `pages` - 页面组件
  - `sections` - 功能区块
  - `ui-components` - UI 基础组件
  - `components` - 业务组件
- **资源目录**: 按类型分目录存放（js/css/images/fonts）
- **Git 信息注入**: 构建时自动注入 Git commit hash 和提交历史

### 环境变量

项目使用 Vite 的环境变量机制。定义环境变量文件：

```bash
# .env
VITE_SOME_KEY=some-value
```

在代码中使用：

```typescript
const value = import.meta.env.VITE_SOME_KEY;
```

> 注意：当前项目未使用自定义环境变量，配置主要通过运行时 UI 或 URL 参数完成。

## 部署

### 静态托管

构建产物 `dist/` 是纯静态文件，可部署到任意静态托管服务：

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- GitHub Pages
- Nginx / Apache

### Cloudflare Pages 注意事项

由于 Cloudflare Pages 使用浅克隆，`git log` 可能无法获取完整提交历史。项目已通过以下方式兼容：

1. 构建时运行 `generate-changelog.js` 将提交历史写入 `public/changelog.json`
2. `vite.config.ts` 优先从 Git 获取，失败时回退到 `changelog.json`

### Docker 部署（可选）

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## 相关文档

- [api.md](./api.md) - 后端 HTTP API 完整文档（房间列表、管理员 API、OTP 鉴权等）
- [websocket.md](./websocket.md) - WebSocket 实时通信协议文档

## 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本（含 changelog 生成）|
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | 运行 ESLint 代码检查 |
| `pnpm changelog` | 手动生成 changelog.json |

## 浏览器支持

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/my-feature`
3. 提交代码：`git commit -m "feat: add some feature"`
4. 推送分支：`git push origin feat/my-feature`
5. 创建 Pull Request

提交信息请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `perf:` 性能优化

## 开源协议

[MIT License](./LICENSE)

---

> 本项目与 [Phira](https://phira.moe) 音游官方无关，是为 tphira-mp 多人联机服务开发的第三方管理工具。
