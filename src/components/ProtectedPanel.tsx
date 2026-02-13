import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Key, Globe, ArrowRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface ProtectedPanelProps {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
}

export function ProtectedPanel({ children, onAuthSuccess }: ProtectedPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [useToken, setUseToken] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedToken = localStorage.getItem('api_admin_token') || '';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';
    
    setBaseUrl(savedUrl);
    setAdminToken(savedToken);
    setUseToken(savedUseToken);
    
    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });

    // 检查是否已配置且有token
    if (savedUrl && (!savedUseToken || savedToken)) {
      setIsAuthenticated(true);
      onAuthSuccess?.();
    }
    setIsChecking(false);
  };

  const handleAuth = () => {
    if (!baseUrl) {
      toast.error('请先输入API地址');
      return;
    }
    
    if (useToken && !adminToken) {
      toast.error('请输入管理员 TOKEN 或关闭 TOKEN 验证');
      return;
    }

    localStorage.setItem('api_base_url', baseUrl);
    localStorage.setItem('api_admin_token', adminToken);
    localStorage.setItem('api_use_token', useToken.toString());
    
    apiService.setConfig({
      baseUrl,
      adminToken: useToken ? adminToken : '',
    });
    
    setIsAuthenticated(true);
    onAuthSuccess?.();
    toast.success('验证成功');
  };

  if (isChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 animate-fade-in">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>需要管理员权限</CardTitle>
            <CardDescription>
              请先配置 API 地址和管理员 TOKEN 以访问此功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authBaseUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                API 地址
              </Label>
              <Input
                id="authBaseUrl"
                placeholder="http://127.0.0.1:12347"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <Label htmlFor="authUseToken">使用 TOKEN</Label>
              </div>
              <Switch
                id="authUseToken"
                checked={useToken}
                onCheckedChange={setUseToken}
              />
            </div>

            {useToken && (
              <div className="space-y-2">
                <Label htmlFor="authToken">管理员 TOKEN</Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="your_admin_token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                />
              </div>
            )}

            <Button onClick={handleAuth} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              进入管理面板
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}
