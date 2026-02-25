import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { PublicRoom } from '@/types/api';

export interface UrlConfig {
  apiUrl: string | null;
  adminToken: string | null;
}

export interface ConfigValidationResult {
  success: boolean;
  message: string;
  rooms?: PublicRoom[];
}

export function useUrlConfig() {
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState<UrlConfig>({ apiUrl: null, adminToken: null });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const apiUrl = searchParams.get('api_url');
    const adminToken = searchParams.get('admin_token');

    if (apiUrl || adminToken) {
      setConfig({
        apiUrl,
        adminToken
      });
    }
  }, [searchParams]);

  const validateApiConfig = async (apiUrl: string, adminToken: string | null): Promise<ConfigValidationResult> => {
    try {
      const testUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const response = await fetch(`${testUrl}/room`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.rooms)) {
          const playerCount = data.rooms.reduce((sum: number, room: PublicRoom) => sum + (room.players?.length || 0), 0);
          return {
            success: true,
            message: `获取到 ${data.rooms.length} 个房间，共 ${playerCount} 名玩家`,
            rooms: data.rooms
          };
        }
        return {
          success: true,
          message: 'API 连接成功！'
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: adminToken ? 'Admin Token 无效' : '需要 Admin Token 进行认证'
        };
      } else {
        return {
          success: false,
          message: `API 返回错误: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  };

  const applyConfig = async (): Promise<boolean> => {
    if (!config.apiUrl && !config.adminToken) {
      return false;
    }

    setIsValidating(true);

    try {
      const apiUrl = config.apiUrl || localStorage.getItem('api_base_url') || '';

      if (!apiUrl) {
        toast.error('无法应用配置：缺少 API 地址');
        return false;
      }

      const validation = await validateApiConfig(apiUrl, config.adminToken);

      if (validation.success) {
        localStorage.setItem('api_base_url', apiUrl);

        if (config.adminToken) {
          localStorage.setItem('api_admin_token', config.adminToken);
          localStorage.setItem('api_use_token', 'true');
        }

        apiService.setConfig({
          baseUrl: apiUrl,
          adminToken: config.adminToken || '',
        });

        // 触发全局事件，通知 RoomQueryPanel 更新房间数据
        if (validation.rooms) {
          window.dispatchEvent(new CustomEvent('urlConfigRoomsLoaded', { detail: validation.rooms }));
        }

        toast.success(validation.message);
        return true;
      } else {
        toast.error(validation.message);
        return false;
      }
    } finally {
      setIsValidating(false);
    }
  };

  const hasUrlConfig = !!config.apiUrl || !!config.adminToken;

  return {
    config,
    hasUrlConfig,
    isValidating,
    applyConfig,
    validateApiConfig,
  };
}
