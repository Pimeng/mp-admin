import { useEffect, useRef } from 'react';
import { apiService } from '@/services/api';

export interface ApiConfigResult {
  baseUrl: string;
  adminToken: string;
  tokenType: string;
  useToken: boolean;
}

export function useApiConfig() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedTokenType = localStorage.getItem('api_token_type') || 'permanent';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';

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
  }, []);

  return {
    isConfigured: () => apiService.isConfigured(),
    getBaseUrl: () => apiService.getBaseUrl(),
    getAdminToken: () => apiService.getAdminToken(),
  };
}

export function loadApiConfigFromStorage(): ApiConfigResult {
  const baseUrl = localStorage.getItem('api_base_url') || '';
  const tokenType = localStorage.getItem('api_token_type') || 'permanent';
  const useToken = localStorage.getItem('api_use_token') !== 'false';

  let adminToken = '';
  if (useToken) {
    if (tokenType === 'temp') {
      adminToken = localStorage.getItem('api_temp_token') || '';
    } else {
      adminToken = localStorage.getItem('api_admin_token') || '';
    }
  }

  return { baseUrl, adminToken, tokenType, useToken };
}

export function applyApiConfig(): void {
  const config = loadApiConfigFromStorage();
  apiService.setConfig({
    baseUrl: config.baseUrl,
    adminToken: config.useToken ? config.adminToken : '',
  });
}
