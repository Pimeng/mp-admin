import { useState, useEffect, useCallback } from 'react';
import { phiraApiService, type ChartInfo } from '@/services/phiraApi';

interface UseChartInfoOptions {
  enabled?: boolean;
}

export function useChartInfo(chartId: number | null | undefined, options: UseChartInfoOptions = {}) {
  const { enabled = true } = options;
  const [chartInfo, setChartInfo] = useState<ChartInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChartInfo = useCallback(async () => {
    if (!chartId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const info = await phiraApiService.getChartInfoCached(chartId);
      if (info) {
        setChartInfo(info);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取谱面信息失败'));
    } finally {
      setIsLoading(false);
    }
  }, [chartId, enabled]);

  useEffect(() => {
    fetchChartInfo();
  }, [fetchChartInfo]);

  const refetch = useCallback(() => {
    return fetchChartInfo();
  }, [fetchChartInfo]);

  return {
    chartInfo,
    isLoading,
    error,
    refetch,
  };
}

// 批量获取谱面信息的 Hook
export function useChartsInfo(chartIds: number[]) {
  const [chartsInfo, setChartsInfo] = useState<Map<number, ChartInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (chartIds.length === 0) return;

    const fetchCharts = async () => {
      setIsLoading(true);
      const results = await phiraApiService.loadChartInfos(chartIds);
      setChartsInfo(results);
      setIsLoading(false);
    };

    fetchCharts();
  }, [chartIds.join(',')]);

  return {
    chartsInfo,
    isLoading,
  };
}
