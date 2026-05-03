import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Shield,
  Loader2,
  ArrowLeft,
  Save
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useOtpAuth } from '@/hooks/useOtpAuth';

const TOKEN_TYPE_PERMANENT = 'permanent';
const TOKEN_TYPE_TEMP = 'temp';

interface AdminTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTokenSaved?: () => void;
  onTokenSkipped?: () => void;
  configId: string;
}

// Token 配置存储接口
interface TokenConfig {
  configId: string;
  adminToken: string;
  tokenType: typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP;
  useToken: boolean;
}

export function AdminTokenDialog({ open, onOpenChange, onTokenSaved, onTokenSkipped, configId }: AdminTokenDialogProps) {
  const [adminToken, setAdminToken] = useState('');
  const [useToken, setUseToken] = useState(true);
  const [tokenType, setTokenType] = useState<typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP>(TOKEN_TYPE_PERMANENT);
  const [currentStep, setCurrentStep] = useState<'type' | 'config'>('type');

  const otpAuth = useOtpAuth();

  // 从 localStorage 加载指定配置的 token
  const loadTokenForConfig = (cfgId: string): TokenConfig | null => {
    try {
      const tokens = localStorage.getItem('api_config_tokens');
      if (tokens) {
        const tokenMap: Record<string, TokenConfig> = JSON.parse(tokens);
        return tokenMap[cfgId] || null;
      }
    } catch {
      // 解析失败返回 null
    }
    return null;
  };

  // 保存 token 到 localStorage，按 configId 存储
  const saveTokenForConfig = (cfgId: string, tokenConfig: TokenConfig) => {
    try {
      const tokens = localStorage.getItem('api_config_tokens');
      const tokenMap: Record<string, TokenConfig> = tokens ? JSON.parse(tokens) : {};
      tokenMap[cfgId] = tokenConfig;
      localStorage.setItem('api_config_tokens', JSON.stringify(tokenMap));
    } catch {
      toast.error('保存配置失败');
    }
  };

  // 初始化时加载已有 token
  const initWithExistingToken = () => {
    const existing = loadTokenForConfig(configId);
    if (existing && existing.useToken) {
      setAdminToken(existing.adminToken);
      setTokenType(existing.tokenType);
      setUseToken(existing.useToken);
    } else {
      setAdminToken('');
      setTokenType(TOKEN_TYPE_PERMANENT);
      setUseToken(true);
    }
    setCurrentStep('type');
    otpAuth.reset();
  };

  // 当对话框打开时初始化
  useState(() => {
    if (open) {
      initWithExistingToken();
    }
  });

  const handleChooseTokenType = (type: typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP) => {
    setTokenType(type);
    setAdminToken('');
    setUseToken(true);
    setCurrentStep('config');
    otpAuth.reset();
  };

  const handleSkipToken = () => {
    setUseToken(false);
    saveTokenForConfig(configId, {
      configId,
      adminToken: '',
      tokenType: TOKEN_TYPE_PERMANENT,
      useToken: false,
    });

    const baseUrl = localStorage.getItem('api_base_url') || '';
    apiService.setConfig({
      baseUrl,
      adminToken: '',
    });

    toast.success('已跳过管理员TOKEN配置');
    onTokenSkipped?.();
    onOpenChange(false);
  };

  const handleSaveToken = () => {
    if (useToken && !adminToken) {
      toast.error('请输入管理员TOKEN');
      return;
    }

    const baseUrl = localStorage.getItem('api_base_url') || '';

    // 保存到 config-specific 存储
    saveTokenForConfig(configId, {
      configId,
      adminToken: useToken ? adminToken : '',
      tokenType,
      useToken,
    });

    // 同时保存到当前配置（兼容旧代码）
    localStorage.setItem('api_use_token', useToken.toString());
    localStorage.setItem('api_token_type', tokenType);
    if (useToken) {
      if (tokenType === TOKEN_TYPE_TEMP) {
        localStorage.setItem('api_temp_token', adminToken);
      } else {
        localStorage.setItem('api_admin_token', adminToken);
      }
    }

    apiService.setConfig({
      baseUrl,
      adminToken: useToken ? adminToken : '',
    });

    toast.success('管理员TOKEN已保存');
    onTokenSaved?.();
    onOpenChange(false);
  };

  const handleOtpSuccess = (token: string) => {
    setAdminToken(token);
    setTokenType(TOKEN_TYPE_TEMP);
    setUseToken(true);

    const baseUrl = localStorage.getItem('api_base_url') || '';

    // 保存到 config-specific 存储
    saveTokenForConfig(configId, {
      configId,
      adminToken: token,
      tokenType: TOKEN_TYPE_TEMP,
      useToken: true,
    });

    // 同时保存到当前配置（兼容旧代码）
    localStorage.setItem('api_use_token', 'true');
    localStorage.setItem('api_temp_token', token);
    localStorage.setItem('api_token_type', TOKEN_TYPE_TEMP);

    apiService.setConfig({
      baseUrl,
      adminToken: token,
    });

    toast.success('验证成功，临时 TOKEN 已保存并生效');
    onTokenSaved?.();
    onOpenChange(false);
  };

  const handleBack = () => {
    setCurrentStep('type');
    setAdminToken('');
    otpAuth.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep('type');
    setAdminToken('');
    otpAuth.reset();
  };

  // 渲染TOKEN类型选择
  const renderTokenTypeStep = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">配置管理员 TOKEN</h3>
        <p className="text-sm text-muted-foreground">
          管理员 TOKEN 用于访问管理功能，如房间管理、用户管理等
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-3 h-auto py-4 justify-start px-4"
          onClick={() => handleChooseTokenType(TOKEN_TYPE_PERMANENT)}
        >
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium block">永久 TOKEN</span>
            <span className="text-xs text-muted-foreground">服务器配置的长期有效 TOKEN</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-3 h-auto py-4 justify-start px-4"
          onClick={() => handleChooseTokenType(TOKEN_TYPE_TEMP)}
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium block">临时 TOKEN</span>
            <span className="text-xs text-muted-foreground">通过验证码获取，有效期4小时</span>
          </div>
        </Button>
      </div>

      <Button variant="ghost" onClick={handleSkipToken} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        跳过配置
      </Button>
    </div>
  );

  // 渲染TOKEN配置
  const renderTokenConfigStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="adminToken" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {tokenType === TOKEN_TYPE_TEMP ? '临时 TOKEN' : '永久 TOKEN'}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentStep('type');
              setAdminToken('');
              otpAuth.reset();
            }}
          >
            切换类型
          </Button>
        </div>
        <Input
          id="adminToken"
          type="password"
          placeholder={tokenType === TOKEN_TYPE_TEMP ? '通过验证码获取的临时 TOKEN' : '服务器配置的永久 ADMIN_TOKEN'}
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
        />
        {tokenType === TOKEN_TYPE_TEMP ? (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              临时 TOKEN 有效期4小时，IP变化可能导致被封禁
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
              永久 TOKEN 是服务器配置的 ADMIN_TOKEN，长期有效
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* 验证码区域 - 选择临时TOKEN时直接显示 */}
      {tokenType === TOKEN_TYPE_TEMP && !adminToken && (
        <div className="border rounded-lg p-3 space-y-3">
          {otpAuth.step === 'request' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                点击下方按钮请求验证码，验证码将显示在服务器终端
              </p>
              <Button
                onClick={otpAuth.requestOtp}
                size="sm"
                className="w-full"
                disabled={otpAuth.loading}
              >
                {otpAuth.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                请求验证码
              </Button>
            </div>
          )}

          {otpAuth.step === 'verify' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>会话 ID: {otpAuth.ssid.slice(0, 8)}...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                请查看服务器终端获取 8 位验证码
              </p>
              <Input
                placeholder="输入 8 位验证码"
                value={otpAuth.otp}
                onChange={(e) => otpAuth.setOtp(e.target.value)}
                maxLength={8}
              />
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    const token = await otpAuth.verifyOtp();
                    if (token) {
                      handleOtpSuccess(token);
                    }
                  }}
                  size="sm"
                  className="flex-1"
                  disabled={otpAuth.loading}
                >
                  {otpAuth.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-2" />
                  )}
                  验证并保存
                </Button>
                <Button variant="outline" size="sm" onClick={otpAuth.reset}>
                  重置
                </Button>
              </div>
            </div>
          )}

          {otpAuth.step === 'success' && (
            <div className="space-y-3">
              <div className="p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">认证成功</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  有效期至: {new Date(otpAuth.expiresAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={otpAuth.tempToken}
                  readOnly
                  type="password"
                />
                <Button variant="outline" size="sm" onClick={otpAuth.copyToken}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => handleOtpSuccess(otpAuth.tempToken)}
                size="sm"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <Button onClick={handleSaveToken} className="flex-1" disabled={!adminToken}>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              管理员 TOKEN 配置
            </DialogTitle>
          </div>
          <DialogDescription>
            {currentStep === 'type' && '选择 TOKEN 类型'}
            {currentStep === 'config' && '配置管理员 TOKEN'}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {currentStep === 'type' && renderTokenTypeStep()}
          {currentStep === 'config' && renderTokenConfigStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 导出工具函数，用于在其他组件中获取当前配置的 token
export function getTokenForConfig(configId: string): TokenConfig | null {
  try {
    const tokens = localStorage.getItem('api_config_tokens');
    if (tokens) {
      const tokenMap: Record<string, TokenConfig> = JSON.parse(tokens);
      return tokenMap[configId] || null;
    }
  } catch {
    // 解析失败返回 null
  }
  return null;
}

export function setTokenForConfig(configId: string, tokenConfig: TokenConfig) {
  try {
    const tokens = localStorage.getItem('api_config_tokens');
    const tokenMap: Record<string, TokenConfig> = tokens ? JSON.parse(tokens) : {};
    tokenMap[configId] = tokenConfig;
    localStorage.setItem('api_config_tokens', JSON.stringify(tokenMap));
  } catch {
    console.error('Failed to save token config');
  }
}
