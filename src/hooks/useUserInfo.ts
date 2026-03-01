import { useState, useEffect, useCallback } from 'react';
import { phiraApiService, type UserDetailInfo } from '@/services/phiraApi';

interface UseUserInfoOptions {
  enabled?: boolean;
}

export function useUserInfo(userId: number | null | undefined, options: UseUserInfoOptions = {}) {
  const { enabled = true } = options;
  const [userInfo, setUserInfo] = useState<UserDetailInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserInfo = useCallback(async () => {
    if (!userId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const info = await phiraApiService.getUserInfoCached(userId);
      if (info) {
        setUserInfo(info);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取用户信息失败'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const refetch = useCallback(() => {
    return fetchUserInfo();
  }, [fetchUserInfo]);

  return {
    userInfo,
    isLoading,
    error,
    refetch,
  };
}

// 批量获取用户信息的 Hook
export function useUsersInfo(userIds: number[]) {
  const [usersInfo, setUsersInfo] = useState<Map<number, UserDetailInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      const results = new Map<number, UserDetailInfo>();

      await Promise.all(
        userIds.map(async (id) => {
          try {
            const info = await phiraApiService.getUserInfoCached(id);
            if (info) {
              results.set(id, info);
            }
          } catch {
            // 静默失败
          }
        })
      );

      setUsersInfo(results);
      setIsLoading(false);
    };

    fetchUsers();
  }, [userIds.join(',')]);

  return {
    usersInfo,
    isLoading,
  };
}
