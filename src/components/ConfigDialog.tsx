import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Globe, Key, Save, TestTube, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface ConfigDialogProps {
  onConfigChange?: () => void;
  children?: React.ReactNode;
}

export function ConfigDialog({ onConfigChange, children }: ConfigDialogProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [useToken, setUseToken] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [open, setOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedToken = localStorage.getItem('api_admin_token') || '';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';
    setBaseUrl(savedUrl);
    setAdminToken(savedToken);
    setUseToken(savedUseToken);
    setIsConfigured(!!savedUrl);
    
    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('api_base_url', baseUrl);
    localStorage.setItem('api_admin_token', adminToken);
    localStorage.setItem('api_use_token', useToken.toString());
    
    apiService.setConfig({
      baseUrl,
      adminToken: useToken ? adminToken : '',
    });
    
    setIsConfigured(!!baseUrl);
    onConfigChange?.();
    toast.success('配置已保存');
    setOpen(false);
  };

  const handleTestConnection = async () => {
    if (!baseUrl) {
      toast.error('请先输入API地址');
      return;
    }
    
    setIsTesting(true);
    try {
      apiService.setConfig({
        baseUrl,
        adminToken: useToken ? adminToken : '',
      });
      
      await apiService.getRooms();
      toast.success('连接测试成功！');
    } catch (error) {
      toast.error('连接测试失败，请检查API地址');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="relative">
            <Settings className="h-4 w-4 mr-2" />
            API 配置
            {isConfigured && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API 配置
          </DialogTitle>
          <DialogDescription>
            配置 API 服务器地址和管理员 TOKEN
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API 地址
            </Label>
            <Input
              id="baseUrl"
              placeholder="http://127.0.0.1:12347"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              例如: http://127.0.0.1:12347
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <Label htmlFor="useToken">使用管理员 TOKEN</Label>
            </div>
            <Switch
              id="useToken"
              checked={useToken}
              onCheckedChange={setUseToken}
            />
          </div>

          {useToken && (
            <div className="space-y-2">
              <Label htmlFor="adminToken">管理员 TOKEN</Label>
              <Input
                id="adminToken"
                type="password"
                placeholder="your_admin_token"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                可选。留空可使用一次性验证码方式获取
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              保存配置
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              测试
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
