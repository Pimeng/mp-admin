import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { useRouteRestore } from '@/hooks/useRouteRestore';
import { useUrlConfig } from '@/hooks/useUrlConfig';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { version } from '../package.json';
import {
  Server,
  Users,
  Film,
  Shield,
  Settings,
  Code2,
  Menu,
  X,
  Tag,
  Loader2
} from 'lucide-react';

type TabType = 'rooms' | 'replay' | 'admin';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('rooms');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configKey, setConfigKey] = useState(0);
  const { hasUrlConfig, isValidating, applyConfig } = useUrlConfig();

  useEffect(() => {
    // 加载配置
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedTokenType = localStorage.getItem('api_token_type') || 'permanent';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';
    
    // 根据类型获取对应的token
    let savedToken = '';
    if (savedUseToken) {
      if (savedTokenType === 'temp') {
        savedToken = localStorage.getItem('api_temp_token') || '';
      } else {
        savedToken = localStorage.getItem('api_admin_token') || '';
      }
    }
    
    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });
    
    setIsConfigured(!!savedUrl);

    // 检查登录状态
    const phiraToken = phiraApiService.getUserToken();
    setIsLoggedIn(!!phiraToken);
  }, []);

  useEffect(() => {
    if (hasUrlConfig) {
      applyConfig().then(success => {
        if (success) {
          setIsConfigured(true);
          setConfigKey(prev => prev + 1);
        }
      });
    }
  }, [hasUrlConfig]);

  const handleConfigChange = () => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    setIsConfigured(!!savedUrl);
    setConfigKey(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const tabs = [
    { id: 'rooms' as TabType, label: '房间查询', icon: Users },
    { id: 'replay' as TabType, label: '录制回放', icon: Film },
    { id: 'admin' as TabType, label: '管理员', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'rooms':
        return <RoomQueryPanel />;
      case 'replay':
        return <ReplayPanel />;
      case 'admin':
        return (
          <ProtectedPanel>
            <AdminApiPanel />
          </ProtectedPanel>
        );
      default:
        return <RoomQueryPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg transition-transform hover:scale-105">
                <Server className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Phira MP</h1>
                <p className="text-sm text-muted-foreground">
                  多人联机面板
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在验证配置...
                </div>
              )}
              <ThemeToggle />
              <ConfigDialog onConfigChange={handleConfigChange}>
                <Button variant="outline" size="sm" className="relative">
                  <Settings className="h-4 w-4 mr-2" />
                  API 配置
                  {isConfigured && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </Button>
              </ConfigDialog>
              <UserMenu onLoginSuccess={handleLoginSuccess} />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-3 animate-slide-in">
              {isValidating && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在验证配置...
                </div>
              )}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <ConfigDialog onConfigChange={handleConfigChange}>
                  <Button variant="outline" size="sm" className="flex-1 relative">
                    <Settings className="h-4 w-4 mr-2" />
                    API 配置
                    {isConfigured && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </Button>
                </ConfigDialog>
                <UserMenu onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-card/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 whitespace-nowrap relative
                    ${isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div key={`${activeTab}-${configKey}`} className="animate-slide-in">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>Phira MP | Made By Pimeng | 目前兼容 <a href="https://github.com/Pimeng/tphira-mp" target="_blank" rel="noopener noreferrer">tphira-mp</a> 的API格式 | <a href="https://status.dmocken.top/" target="_blank" rel="noopener noreferrer">多人联机服务可用性</a></span>
            </div>
            <div className="flex items-center gap-4">
              {isConfigured && (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  API 已配置
                </span>
              )}
              {isLoggedIn && (
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  已登录
                </span>
              )}
              <ChangelogDialog>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
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
    </div>
  );
}

// 路由恢复包装组件
function RouteRestoreWrapper({ children }: { children: React.ReactNode }) {
  useRouteRestore();
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RouteRestoreWrapper><MainLayout /></RouteRestoreWrapper>} />
        <Route path="/room/:roomId" element={<RouteRestoreWrapper><RoomDetailPage /></RouteRestoreWrapper>} />
        <Route path="/public/room/:roomId" element={<RouteRestoreWrapper><PublicRoomDetailPage /></RouteRestoreWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
