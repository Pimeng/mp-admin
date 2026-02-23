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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Globe,
  Key,
  Save,
  TestTube,
  Loader2,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Shield,
  ArrowRight,
  ArrowLeft,
  User,
  X
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useOtpAuth } from '@/hooks/useOtpAuth';

interface ConfigDialogProps {
  onConfigChange?: () => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Token 类型
const TOKEN_TYPE_PERMANENT = 'permanent';
const TOKEN_TYPE_TEMP = 'temp';

// 配置步骤
const STEP_URL = 'url';
const STEP_TOKEN_NEED = 'token_need';
const STEP_TOKEN_TYPE = 'token_type';
const STEP_TOKEN_CONFIG = 'token_config';

export function ConfigDialog({ onConfigChange, children, defaultOpen, onOpenChange }: ConfigDialogProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [useToken, setUseToken] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [open, setOpen] = useState(defaultOpen || false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [tokenType, setTokenType] = useState<typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP>(TOKEN_TYPE_PERMANENT);
  const [currentStep, setCurrentStep] = useState<typeof STEP_URL | typeof STEP_TOKEN_NEED | typeof STEP_TOKEN_TYPE | typeof STEP_TOKEN_CONFIG>(STEP_URL);

  const otpAuth = useOtpAuth();

  useEffect(() => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedTokenType = localStorage.getItem('api_token_type') || TOKEN_TYPE_PERMANENT;
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';

    // 根据类型获取对应的token
    let savedToken = '';
    if (savedUseToken) {
      if (savedTokenType === TOKEN_TYPE_TEMP) {
        savedToken = localStorage.getItem('api_temp_token') || '';
      } else {
        savedToken = localStorage.getItem('api_admin_token') || '';
      }
    }

    setBaseUrl(savedUrl);
    setAdminToken(savedToken);
    setUseToken(savedUseToken);
    setTokenType(savedTokenType as typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP);
    setIsConfigured(!!savedUrl);

    // 检查URL有效性
    if (savedUrl) {
      checkUrlValidity(savedUrl);
    }

    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });
  }, []);

  // 当URL改变时检查有效性
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (baseUrl) {
        checkUrlValidity(baseUrl);
      } else {
        setIsUrlValid(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [baseUrl]);

  // 同步外部 open 状态
  useEffect(() => {
    if (defaultOpen !== undefined) {
      setOpen(defaultOpen);
    }
  }, [defaultOpen]);

  const checkUrlValidity = async (url: string) => {
    if (!url) return;
    setIsCheckingUrl(true);
    try {
      // 使用 /room 接口校验 API 是否有效
      const response = await fetch(`${url}/room`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      setIsUrlValid(response.ok);
    } catch {
      setIsUrlValid(false);
    } finally {
      setIsCheckingUrl(false);
    }
  };

  const handleSaveUrl = () => {
    if (!baseUrl) {
      toast.error('请输入API地址');
      return;
    }
    if (!isUrlValid) {
      toast.error('API地址无效，请检查');
      return;
    }

    localStorage.setItem('api_base_url', baseUrl);
    apiService.setConfig({
      baseUrl,
      adminToken: '',
    });

    setIsConfigured(true);
    onConfigChange?.();
    toast.success('API地址已保存');

    // 进入下一步：询问是否需要配置TOKEN
    setCurrentStep(STEP_TOKEN_NEED);
  };

  const handleSkipToken = () => {
    // 不配置TOKEN，直接关闭
    localStorage.setItem('api_use_token', 'false');
    setUseToken(false);
    apiService.setConfig({
      baseUrl,
      adminToken: '',
    });
    setOpen(false);
    setCurrentStep(STEP_URL);
    onConfigChange?.();
    toast.success('配置完成，已跳过管理员TOKEN配置');
  };

  const handleChooseTokenType = (type: typeof TOKEN_TYPE_PERMANENT | typeof TOKEN_TYPE_TEMP) => {
    setTokenType(type);
    setAdminToken('');
    setUseToken(true);
    setCurrentStep(STEP_TOKEN_CONFIG);
  };

  const handleSaveToken = () => {
    if (useToken && !adminToken) {
      toast.error('请输入管理员TOKEN');
      return;
    }

    localStorage.setItem('api_use_token', useToken.toString());

    if (useToken) {
      // 根据当前选择的类型存储
      if (tokenType === TOKEN_TYPE_TEMP) {
        localStorage.setItem('api_temp_token', adminToken);
        localStorage.setItem('api_token_type', TOKEN_TYPE_TEMP);
      } else {
        localStorage.setItem('api_admin_token', adminToken);
        localStorage.setItem('api_token_type', TOKEN_TYPE_PERMANENT);
      }
    }

    apiService.setConfig({
      baseUrl,
      adminToken: useToken ? adminToken : '',
    });

    onConfigChange?.();
    toast.success('配置已保存');
    setOpen(false);
    setCurrentStep(STEP_URL);
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
      setIsUrlValid(true);
      toast.success('连接测试成功！');
    } catch (error) {
      setIsUrlValid(false);
      toast.error('连接测试失败，请检查API地址');
    } finally {
      setIsTesting(false);
    }
  };

  const handleOtpSuccess = (token: string) => {
    setAdminToken(token);
    setTokenType(TOKEN_TYPE_TEMP);
    setUseToken(true);

    localStorage.setItem('api_base_url', baseUrl);
    localStorage.setItem('api_temp_token', token);
    localStorage.setItem('api_use_token', 'true');
    localStorage.setItem('api_token_type', TOKEN_TYPE_TEMP);

    apiService.setConfig({
      baseUrl,
      adminToken: token,
    });

    setIsConfigured(true);
    onConfigChange?.();
    toast.success('验证成功，临时 TOKEN 已保存并生效');
    setOpen(false);
    setCurrentStep(STEP_URL);
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
    // 重置到第一步
    setTimeout(() => setCurrentStep(STEP_URL), 300);
  };

  const handleBack = () => {
    if (currentStep === STEP_TOKEN_CONFIG) {
      setCurrentStep(STEP_TOKEN_TYPE);
      setAdminToken('');
      otpAuth.reset();
    } else if (currentStep === STEP_TOKEN_TYPE) {
      setCurrentStep(STEP_TOKEN_NEED);
    } else if (currentStep === STEP_TOKEN_NEED) {
      setCurrentStep(STEP_URL);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const steps = [
      { id: STEP_URL, label: 'API地址' },
      { id: STEP_TOKEN_NEED, label: 'TOKEN配置' },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-xs ${
                index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染第一步：配置API地址
  const renderUrlStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="baseUrl" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          API 地址
        </Label>
        <div className="relative">
          <Input
            id="baseUrl"
            placeholder="http://127.0.0.1:12347"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          {isCheckingUrl ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : baseUrl && (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isUrlValid ? 'bg-green-500' : 'bg-red-500'}`} />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          例如: http://127.0.0.1:12347
        </p>
        {baseUrl && !isCheckingUrl && (
          <p className={`text-xs ${isUrlValid ? 'text-green-600' : 'text-red-600'}`}>
            {isUrlValid ? 'API 地址有效' : 'API 地址无效或无法连接'}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSaveUrl} className="flex-1" disabled={!isUrlValid}>
          <ArrowRight className="h-4 w-4 mr-2" />
          下一步
        </Button>
        <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || !baseUrl}>
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          测试
        </Button>
      </div>
    </div>
  );

  // 渲染第二步：选择是否配置TOKEN
  const renderTokenNeedStep = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">是否需要配置管理员 TOKEN？</h3>
        <p className="text-sm text-muted-foreground">
          管理员 TOKEN 用于访问管理功能，如房间管理、用户管理等
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={handleSkipToken}
        >
          <User className="h-6 w-6" />
          <span className="text-sm">不需要</span>
          <span className="text-xs text-muted-foreground">仅使用房间查询功能</span>
        </Button>
        <Button
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => setCurrentStep(STEP_TOKEN_TYPE)}
        >
          <Shield className="h-6 w-6" />
          <span className="text-sm">需要配置</span>
          <span className="text-xs text-primary-foreground/80">访问完整管理功能</span>
        </Button>
      </div>

      <Button variant="ghost" onClick={handleBack} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回上一步
      </Button>
    </div>
  );

  // 渲染TOKEN类型选择
  const renderTokenTypeStep = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">选择 TOKEN 类型</h3>
        <p className="text-sm text-muted-foreground">
          请选择您要配置的管理员 TOKEN 类型
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

      <Button variant="ghost" onClick={handleBack} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>
    </div>
  );

  // 渲染第三步：配置TOKEN
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
              setCurrentStep(STEP_TOKEN_TYPE);
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

  // 根据当前步骤渲染内容
  const renderContent = () => {
    switch (currentStep) {
      case STEP_URL:
        return renderUrlStep();
      case STEP_TOKEN_NEED:
        return renderTokenNeedStep();
      case STEP_TOKEN_TYPE:
        return renderTokenTypeStep();
      case STEP_TOKEN_CONFIG:
        return renderTokenConfigStep();
      default:
        return renderUrlStep();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      onOpenChange?.(newOpen);
      if (!newOpen) {
        setTimeout(() => setCurrentStep(STEP_URL), 300);
      }
    }}>
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API 配置
            </DialogTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {currentStep === STEP_URL && '配置 API 服务器地址'}
            {currentStep === STEP_TOKEN_NEED && '选择是否需要配置管理员 TOKEN'}
            {currentStep === STEP_TOKEN_TYPE && '选择管理员 TOKEN 类型'}
            {currentStep === STEP_TOKEN_CONFIG && '配置管理员 TOKEN'}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="pt-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
