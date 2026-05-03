import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfigDialog } from '@/components/ConfigDialog';
import { UserMenu } from '@/components/UserMenu';
import { ProtectedPanel } from '@/components/ProtectedPanel';
import { PlayerLayout } from '@/components/PlayerLayout';
import { RoomQueryPanel } from '@/sections/RoomQueryPanel';
import { ReplayPanel } from '@/sections/ReplayPanel';
import { AdminApiPanel } from '@/sections/AdminApiPanel';
import { ModeSelectPage } from '@/pages/ModeSelectPage';
import { getLastMode, setLastMode, type AppMode } from '@/lib/app-mode';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import { PublicRoomDetailPage } from '@/pages/PublicRoomDetailPage';
import { phiraApiService } from '@/services/phiraApi';
import { applyApiConfig } from '@/hooks/useApiConfig';
import { useUrlConfig } from '@/hooks/useUrlConfig';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { ClarityNotice } from '@/components/ClarityNotice';
import { version } from '../package.json';
import {
  Code2,
  Gamepad2,
  Loader2,
  Menu,
  Server,
  Settings,
  Shield,
  Tag,
  X,
  ChevronDown,
  Home,
} from 'lucide-react';

function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => !!localStorage.getItem('api_base_url'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!phiraApiService.getUserToken());
  const [configKey, setConfigKey] = useState(0);
  const { hasUrlConfig, isValidating, applyConfig } = useUrlConfig();
  const location = useLocation();
  const navigate = useNavigate();

  const currentMode: AppMode | null = location.pathname.startsWith('/player')
    ? 'player'
    : location.pathname.startsWith('/admin')
    ? 'admin'
    : null;

  useEffect(() => {
    applyApiConfig();
  }, []);

  useEffect(() => {
    if (hasUrlConfig) {
      applyConfig().then((success) => {
        if (success) {
          setIsConfigured(true);
        }
      });
    }
  }, [applyConfig, hasUrlConfig]);

  useEffect(() => {
    if (currentMode) {
      setLastMode(currentMode);
    }
  }, [currentMode]);

  const handleConfigChange = () => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    setIsConfigured(!!savedUrl);
    setConfigKey((prev) => prev + 1);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleSwitchMode = (mode: AppMode) => {
    setLastMode(mode);
    navigate(mode === 'player' ? '/player/rooms' : '/admin/rooms');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex items-center gap-3 rounded-md text-left transition-opacity hover:opacity-80"
              onClick={() => navigate('/select')}
              title="返回模式选择页"
            >
              <div className="rounded-lg bg-primary p-2 transition-transform hover:scale-105">
                <Server className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Phira MP</h1>
                <p className="text-sm text-muted-foreground">多人联机面板</p>
              </div>
            </button>

            <div className="hidden items-center gap-3 md:flex">
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在验证配置...
                </div>
              )}
              <ModeSwitcher currentMode={currentMode} onSwitch={handleSwitchMode} />
              <ThemeToggle />
              <ConfigDialog onConfigChange={handleConfigChange}>
                <Button variant="outline" size="sm" className="relative">
                  <Settings className="mr-2 h-4 w-4" />
                  API 配置
                  {isConfigured && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-green-500" />
                  )}
                </Button>
              </ConfigDialog>
              <UserMenu onLoginSuccess={handleLoginSuccess} />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="mt-4 space-y-3 border-t pt-4 animate-slide-in md:hidden">
              {isValidating && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在验证配置...
                </div>
              )}
              <ModeSwitcher
                currentMode={currentMode}
                onSwitch={(mode) => {
                  handleSwitchMode(mode);
                  setIsMobileMenuOpen(false);
                }}
                fullWidth
              />
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <ConfigDialog onConfigChange={handleConfigChange}>
                  <Button variant="outline" size="sm" className="relative flex-1">
                    <Settings className="mr-2 h-4 w-4" />
                    API 配置
                    {isConfigured && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </Button>
                </ConfigDialog>
                <UserMenu onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div key={configKey} className="animate-slide-in">
          <Outlet />
        </div>
      </main>

      <footer className="mt-8 border-t animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>
                兼容{' '}
                <a href="https://github.com/Pimeng/tphira-mp" target="_blank" rel="noopener noreferrer">
                  tphira-mp
                </a>{' '}
                的 API 格式 |{' '}
                <a href="https://phira.dmocken.top/status" target="_blank" rel="noopener noreferrer">
                  多人联机服务可用性
                </a>
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isConfigured && (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  API 已配置
                </span>
              )}
              {isLoggedIn && (
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  已登录
                </span>
              )}
              <ChangelogDialog>
                <button className="flex cursor-pointer items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
                  <Tag className="h-3 w-3" />
                  前端版本 v{version}
                </button>
              </ChangelogDialog>
              <span className="flex items-center gap-1 text-muted-foreground" title="Git Commit Hash">
                <span className="text-xs">({__GIT_COMMIT_HASH__})</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" />
      <ClarityNotice />
    </div>
  );
}

interface ModeSwitcherProps {
  currentMode: AppMode | null;
  onSwitch: (mode: AppMode) => void;
  fullWidth?: boolean;
}

function ModeSwitcher({ currentMode, onSwitch, fullWidth }: ModeSwitcherProps) {
  const navigate = useNavigate();
  const Icon = currentMode === 'admin' ? Shield : currentMode === 'player' ? Gamepad2 : Home;
  const label = currentMode === 'admin' ? '管理员模式' : currentMode === 'player' ? '玩家模式' : '选择模式';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={fullWidth ? 'w-full justify-between' : undefined}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>切换使用模式</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onSwitch('player')}
          className={currentMode === 'player' ? 'bg-accent' : undefined}
        >
          <Gamepad2 className="mr-2 h-4 w-4" />
          玩家模式
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSwitch('admin')}
          className={currentMode === 'admin' ? 'bg-accent' : undefined}
        >
          <Shield className="mr-2 h-4 w-4" />
          管理员模式
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/select')}>
          <Home className="mr-2 h-4 w-4" />
          返回选择页
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminLayout() {
  return (
    <ProtectedPanel>
      <Outlet />
    </ProtectedPanel>
  );
}

function RootRedirect() {
  const hasApiUrl = !!localStorage.getItem('api_base_url');
  const lastMode = getLastMode();

  // 没有配置 API URL → 强制走 onboarding
  if (!hasApiUrl) return <ModeSelectPage />;

  // 已配置 + 有上次模式 → 直接进入
  if (lastMode === 'player') return <Navigate to="/player/rooms" replace />;
  if (lastMode === 'admin') return <Navigate to="/admin/rooms" replace />;

  // 已配置但没选过模式 → 让用户选择
  return <ModeSelectPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<RootRedirect />} />
          <Route path="select" element={<ModeSelectPage />} />

          <Route path="player" element={<PlayerLayout />}>
            <Route index element={<Navigate to="/player/rooms" replace />} />
            <Route path="rooms" element={<RoomQueryPanel />} />
            <Route path="replay" element={<ReplayPanel />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/rooms" replace />} />
            <Route path="rooms" element={<AdminApiPanel />} />
            <Route path="users" element={<AdminApiPanel />} />
            <Route path="messages" element={<AdminApiPanel />} />
            <Route path="settings" element={<AdminApiPanel />} />
            <Route path="contest" element={<AdminApiPanel />} />
          </Route>

          <Route path="rooms" element={<Navigate to="/player/rooms" replace />} />
          <Route path="replay" element={<Navigate to="/player/replay" replace />} />
        </Route>
        <Route path="/room/:roomId" element={<RoomDetailPage />} />
        <Route path="/public/room/:roomId" element={<PublicRoomDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
