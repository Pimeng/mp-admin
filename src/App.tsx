import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ConfigDialog } from '@/components/ConfigDialog';
import { UserMenu } from '@/components/UserMenu';
import { ProtectedPanel } from '@/components/ProtectedPanel';
import { RoomQueryPanel } from '@/sections/RoomQueryPanel';
import { ReplayPanel } from '@/sections/ReplayPanel';
import { AdminApiPanel } from '@/sections/AdminApiPanel';
import { RoomDetailPage } from '@/pages/RoomDetailPage';
import { PublicRoomDetailPage } from '@/pages/PublicRoomDetailPage';
import { apiService } from '@/services/api';
import { phiraApiService } from '@/services/phiraApi';
import { useUrlConfig } from '@/hooks/useUrlConfig';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { ClarityNotice } from '@/components/ClarityNotice';
import { version } from '../package.json';
import {
  Code2,
  Film,
  Loader2,
  Menu,
  Server,
  Settings,
  Shield,
  Tag,
  Users,
  X,
} from 'lucide-react';

const mainTabs = [
  { path: '/rooms', matchPath: '/rooms', label: '\u623f\u95f4\u67e5\u8be2', icon: Users },
  { path: '/replay', matchPath: '/replay', label: '\u5f55\u5236\u56de\u653e', icon: Film },
  { path: '/admin/rooms', matchPath: '/admin', label: '\u7ba1\u7406\u5458', icon: Shield },
];

function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configKey, setConfigKey] = useState(0);
  const { hasUrlConfig, isValidating, applyConfig } = useUrlConfig();
  const location = useLocation();

  useEffect(() => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedTokenType = localStorage.getItem('api_token_type') || 'permanent';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';

    let savedToken = '';
    if (savedUseToken) {
      savedToken =
        savedTokenType === 'temp'
          ? localStorage.getItem('api_temp_token') || ''
          : localStorage.getItem('api_admin_token') || '';
    }

    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });

    setIsConfigured(!!savedUrl);
    setIsLoggedIn(!!phiraApiService.getUserToken());
  }, []);

  useEffect(() => {
    if (hasUrlConfig) {
      applyConfig().then((success) => {
        if (success) {
          setIsConfigured(true);
          setConfigKey((prev) => prev + 1);
        }
      });
    }
  }, [applyConfig, hasUrlConfig]);

  const handleConfigChange = () => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    setIsConfigured(!!savedUrl);
    setConfigKey((prev) => prev + 1);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2 transition-transform hover:scale-105">
                <Server className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Phira MP</h1>
                <p className="text-sm text-muted-foreground">多人联机面板</p>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在验证配置...
                </div>
              )}
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

      <nav className="border-b bg-card/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                location.pathname === tab.matchPath ||
                location.pathname.startsWith(`${tab.matchPath}/`);

              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={[
                    'relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

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

function AdminLayout() {
  return (
    <ProtectedPanel>
      <Outlet />
    </ProtectedPanel>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/rooms" replace />} />
          <Route path="rooms" element={<RoomQueryPanel />} />
          <Route path="replay" element={<ReplayPanel />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/rooms" replace />} />
            <Route path="rooms" element={<AdminApiPanel />} />
            <Route path="users" element={<AdminApiPanel />} />
            <Route path="messages" element={<AdminApiPanel />} />
            <Route path="settings" element={<AdminApiPanel />} />
            <Route path="contest" element={<AdminApiPanel />} />
          </Route>
        </Route>
        <Route path="/room/:roomId" element={<RoomDetailPage />} />
        <Route path="/public/room/:roomId" element={<PublicRoomDetailPage />} />
        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
