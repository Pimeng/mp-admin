import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Lock, 
  Unlock, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export function OtpPanel() {
  const [ssid, setSsid] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');

  const handleRequestOtp = async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return;
    }

    try {
      const data = await apiService.requestOtp();
      if (data.ok) {
        setSsid(data.ssid);
        setStep('verify');
        toast.success('验证码已请求，请查看服务器终端');
      } else {
        toast.error('请求失败：' + (data as any).error);
      }
    } catch (error: any) {
      toast.error('请求失败：' + (error.message || '无法使用一次性验证码'));
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('请输入验证码');
      return;
    }
    try {
      const data = await apiService.verifyOtp(ssid, otp);
      if (data.ok) {
        setTempToken(data.token);
        setExpiresAt(data.expiresAt);
        setStep('success');
        
        // 自动设置到 API 服务
        const config = apiService.getConfig();
        apiService.setConfig({
          ...config,
          adminToken: data.token,
        });
        
        // 保存到本地存储
        localStorage.setItem('api_admin_token', data.token);
        localStorage.setItem('api_use_token', 'true');
        
        toast.success('验证成功，临时 TOKEN 已生效');
      } else {
        toast.error('验证失败：' + (data as any).error);
      }
    } catch (error: any) {
      toast.error('验证失败：' + (error.message || '请检查验证码'));
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tempToken);
    toast.success('TOKEN 已复制到剪贴板');
  };

  const handleReset = () => {
    setSsid('');
    setOtp('');
    setTempToken('');
    setExpiresAt(0);
    setStep('request');
  };

  return (
    <div className="animate-fade-in">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            一次性验证码认证
          </CardTitle>
          <CardDescription>
            当服务器未配置永久 ADMIN_TOKEN 时，可通过一次性验证码获取临时 TOKEN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'request' && (
            <div className="space-y-4 animate-slide-in">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p>使用一次性验证码需要：</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>服务器未配置永久 ADMIN_TOKEN</li>
                      <li>能够访问服务器终端查看验证码</li>
                      <li>验证码有效期 5 分钟</li>
                      <li>临时 TOKEN 有效期 4 小时</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button onClick={handleRequestOtp} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                请求验证码
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4 animate-slide-in">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    会话 ID: {ssid.slice(0, 8)}...
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  请查看服务器终端获取 8 位验证码
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">验证码</Label>
                <Input
                  id="otp"
                  placeholder="输入 8 位验证码"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={8}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleVerifyOtp} className="flex-1">
                  <Unlock className="h-4 w-4 mr-2" />
                  验证
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  重置
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">认证成功</span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  临时 TOKEN 已生效，有效期至：{new Date(expiresAt).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>临时 TOKEN</Label>
                <div className="flex gap-2">
                  <Input
                    value={tempToken}
                    readOnly
                    type="password"
                  />
                  <Button variant="outline" onClick={handleCopyToken}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button onClick={handleReset} variant="outline" className="w-full">
                重新认证
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
