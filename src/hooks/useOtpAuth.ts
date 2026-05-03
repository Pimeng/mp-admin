import { useEffect, useRef, useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { OtpMode, OtpVerifyResponse } from '@/types/api';

export type OtpStep = 'request' | 'verify' | 'pending' | 'denied' | 'success';

const CLI_POLL_INTERVAL_MS = 2000;

export function useOtpAuth() {
  const [mode, setModeState] = useState<OtpMode>('otp');
  const [ssid, setSsid] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(0);
  const [step, setStep] = useState<OtpStep>('request');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // 组件卸载时停止轮询
  useEffect(() => stopPolling, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setSsid('');
    setOtp('');
    setTempToken('');
    setExpiresAt(0);
    setSessionExpiresAt(0);
    setStep('request');
    setErrorMessage('');
  }, [stopPolling]);

  const setMode = useCallback((next: OtpMode) => {
    if (next === mode) return;
    stopPolling();
    setModeState(next);
    setSsid('');
    setOtp('');
    setTempToken('');
    setExpiresAt(0);
    setSessionExpiresAt(0);
    setStep('request');
    setErrorMessage('');
  }, [mode, stopPolling]);

  const handleSuccessResponse = useCallback((data: OtpVerifyResponse) => {
    setTempToken(data.token);
    setExpiresAt(data.expiresAt);
    setStep('success');
    setErrorMessage('');
    return data.token;
  }, []);

  // CLI 模式:每 2 秒轮询一次 /admin/otp/verify,直到拿到 token / 被拒 / 会话过期
  const startCliPolling = useCallback((sid: string, expiresAtMs: number) => {
    stopPolling();
    isPollingRef.current = true;

    const tick = async () => {
      if (!isPollingRef.current) return;
      if (Date.now() > expiresAtMs) {
        stopPolling();
        setStep('request');
        setErrorMessage('会话已过期,请重新申请');
        toast.error('会话已过期,请重新申请提权');
        return;
      }
      try {
        const data = await apiService.verifyOtp(sid, { mode: 'cli' });
        if (data.ok && data.token) {
          stopPolling();
          handleSuccessResponse(data);
          toast.success('管理员已批准,临时 TOKEN 已下发');
          return;
        }
        const status = data.status;
        const err = (data as { error?: string }).error;
        if (status === 'denied' || err === 'approval-denied') {
          stopPolling();
          setStep('denied');
          setErrorMessage('管理员已拒绝此次提权申请');
          toast.error('管理员已拒绝此次提权申请');
          return;
        }
        if (err === 'invalid-or-expired-session') {
          stopPolling();
          setStep('request');
          setErrorMessage('会话已过期,请重新申请');
          toast.error('会话已过期,请重新申请提权');
          return;
        }
        if (err === 'ip-mismatch') {
          stopPolling();
          setStep('request');
          setErrorMessage('请求 IP 与申请 IP 不一致');
          toast.error('请求 IP 与申请 IP 不一致');
          return;
        }
        // status === 'pending' 或 error === 'pending-approval':继续等待
      } catch (error) {
        // 单次网络异常不停止轮询,留给下一次尝试
        console.warn('[OTP CLI] poll failed:', error);
      }
    };

    void tick();
    pollTimerRef.current = setInterval(tick, CLI_POLL_INTERVAL_MS);
  }, [handleSuccessResponse, stopPolling]);

  const requestOtp = useCallback(async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return false;
    }

    stopPolling();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await apiService.requestOtp(mode);
      if (data.ok) {
        const expiresIn = data.expiresIn ?? 60000;
        const sessionEnd = Date.now() + expiresIn;
        setSsid(data.ssid);
        setSessionExpiresAt(sessionEnd);
        if (mode === 'cli') {
          setStep('pending');
          startCliPolling(data.ssid, sessionEnd);
          toast.success('已发起提权申请,等待服务器管理员批准');
        } else {
          setStep('verify');
          toast.success('验证码已请求,请查看服务器终端');
        }
        return true;
      }
      const reason = (data as { error?: string }).error || '未知错误';
      toast.error('请求失败:' + reason);
      setErrorMessage(reason);
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '无法发起请求';
      toast.error('请求失败:' + msg);
      setErrorMessage(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [mode, stopPolling, startCliPolling]);

  const verifyOtp = useCallback(async () => {
    if (!otp) {
      toast.error('请输入验证码');
      return null;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await apiService.verifyOtp(ssid, otp);
      if (data.ok) {
        return handleSuccessResponse(data);
      }
      const reason = (data as { error?: string }).error || '验证失败';
      toast.error('验证失败:' + reason);
      setErrorMessage(reason);
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '请检查验证码';
      toast.error('验证失败:' + msg);
      setErrorMessage(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [otp, ssid, handleSuccessResponse]);

  const cancelCliPolling = useCallback(() => {
    stopPolling();
    setStep('request');
    setSsid('');
    setSessionExpiresAt(0);
    setErrorMessage('');
  }, [stopPolling]);

  const copyToken = useCallback(() => {
    navigator.clipboard.writeText(tempToken);
    toast.success('TOKEN 已复制到剪贴板');
  }, [tempToken]);

  return {
    mode,
    ssid,
    otp,
    tempToken,
    expiresAt,
    sessionExpiresAt,
    step,
    loading,
    errorMessage,
    setMode,
    setOtp,
    requestOtp,
    verifyOtp,
    cancelCliPolling,
    copyToken,
    reset,
  };
}
