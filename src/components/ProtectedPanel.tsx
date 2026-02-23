import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfigDialog } from './ConfigDialog';
import { Lock, Settings, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface ProtectedPanelProps {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
}

export function ProtectedPanel({ children, onAuthSuccess }: ProtectedPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';

    // 根据类型获取对应的token
    const savedTokenType = localStorage.getItem('api_token_type') || 'permanent';
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

    // 检查是否已配置且有token
    if (!savedUrl) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    // 如果不需要token，直接通过
    if (!savedUseToken) {
      setIsAuthenticated(true);
      onAuthSuccess?.();
      setIsChecking(false);
      return;
    }

    // 有token时，验证token是否有效
    if (savedToken) {
      try {
        const data = await apiService.getAdminRooms();
        if (data.ok) {
          setIsAuthenticated(true);
          setAuthError(null);
          onAuthSuccess?.();
        } else {
          setIsAuthenticated(false);
          setAuthError('管理员 TOKEN 无效，请重新配置');
          toast.error('管理员 TOKEN 验证失败');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setAuthError('TOKEN 验证失败，请检查 API 地址和 TOKEN');
        toast.error('管理员 TOKEN 验证失败');
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsChecking(false);
  };

  const handleConfigChange = () => {
    checkAuth();
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
              请配置管理员TOKEN后再访问此处
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{authError}</p>
              </div>
            )}
            <ConfigDialog
              onConfigChange={handleConfigChange}
              defaultOpen={configOpen}
              onOpenChange={setConfigOpen}
            >
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                打开API配置
              </Button>
            </ConfigDialog>
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
