import { useState } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export function useOtpAuth() {
  const [ssid, setSsid] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setSsid('');
    setOtp('');
    setTempToken('');
    setExpiresAt(0);
    setStep('request');
  };

  const requestOtp = async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return false;
    }

    setLoading(true);
    try {
      const data = await apiService.requestOtp();
      if (data.ok) {
        setSsid(data.ssid);
        setStep('verify');
        toast.success('验证码已请求，请查看服务器终端');
        return true;
      } else {
        toast.error('请求失败：' + (data as any).error);
        return false;
      }
    } catch (error: any) {
      toast.error('请求失败：' + (error.message || '无法使用一次性验证码'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error('请输入验证码');
      return null;
    }

    setLoading(true);
    try {
      const data = await apiService.verifyOtp(ssid, otp);
      if (data.ok) {
        setTempToken(data.token);
        setExpiresAt(data.expiresAt);
        setStep('success');
        return data.token;
      } else {
        toast.error('验证失败：' + (data as any).error);
        return null;
      }
    } catch (error: any) {
      toast.error('验证失败：' + (error.message || '请检查验证码'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(tempToken);
    toast.success('TOKEN 已复制到剪贴板');
  };

  return {
    ssid,
    otp,
    tempToken,
    expiresAt,
    step,
    loading,
    setOtp,
    requestOtp,
    verifyOtp,
    copyToken,
    reset,
  };
}
