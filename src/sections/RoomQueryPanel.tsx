import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Users,
  RefreshCw,
  Globe,
  Music
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { phiraApiService } from '@/services/phiraApi';
import { toast } from 'sonner';
import { getStateBadgeConfig } from '@/lib/utils';
import { applyApiConfig } from '@/hooks/useApiConfig';

import type { PublicRoom } from '@/types/api';
import type { ChartInfo } from '@/services/phiraApi';

export function RoomQueryPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartInfos, setChartInfos] = useState<Map<number, ChartInfo>>(new Map());
  const hasAutoFetched = useRef(false);

  // 加载谱面信息
  const loadChartInfo = useCallback(async (chartId: number) => {
    const info = await phiraApiService.getChartInfoCached(chartId);
    if (info) {
      setChartInfos(prev => new Map(prev).set(chartId, info));
    }
    return info;
  }, []);

  // 从本地存储加载配置
  useEffect(() => {
    applyApiConfig();

    // 检查是否有 URL 参数传入的配置
    const hasUrlConfig = searchParams.has('api_url') || searchParams.has('admin_token');

    // 自动加载房间列表（只执行一次，且当没有 URL 配置时才自动获取）
    const savedUrl = localStorage.getItem('api_base_url') || '';
    if (savedUrl && !hasAutoFetched.current && !hasUrlConfig) {
      hasAutoFetched.current = true;
      fetchRooms();
    }
  }, []);

  // 监听 URL 配置加载的房间数据
  useEffect(() => {
    const handleUrlConfigRoomsLoaded = (event: CustomEvent<PublicRoom[]>) => {
      const roomsData = event.detail;
      setRooms(roomsData);
      hasAutoFetched.current = true;

      // 预加载谱面信息
      roomsData.forEach(room => {
        if (room.chart?.id) {
          loadChartInfo(Number(room.chart.id));
        }
      });
    };

    window.addEventListener('urlConfigRoomsLoaded', handleUrlConfigRoomsLoaded as EventListener);
    return () => {
      window.removeEventListener('urlConfigRoomsLoaded', handleUrlConfigRoomsLoaded as EventListener);
    };
  }, [loadChartInfo]);

  const fetchRooms = async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.getRooms();
      const roomsData = data.rooms || [];
      setRooms(roomsData);
      
      // 预加载谱面信息
      roomsData.forEach(room => {
        if (room.chart?.id) {
          loadChartInfo(Number(room.chart.id));
        }
      });
      
      const playerCount = roomsData.reduce((sum, room) => sum + (room.players?.length || 0), 0);
      toast.success(`获取到 ${roomsData.length} 个房间，共 ${playerCount} 名玩家`);
    } catch {
      toast.error('获取房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStateBadge = (state: string) => {
    const config = getStateBadgeConfig(state);
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              房间列表
              {rooms.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rooms.length} 个房间
                </Badge>
              )}
            </div>
            <Button size="sm" onClick={fetchRooms} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>获取当前所有房间的基本信息</span>
            {rooms.length > 0 && (
              <span className="text-muted-foreground">
                | 总玩家数: {rooms.reduce((sum, room) => sum + (room.players?.length || 0), 0)} 人
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无房间数据，点击刷新获取
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, index) => {
                  const chartId = Number(room.chart?.id);
                  const chartInfo = chartInfos.get(chartId);
                  
                  return (
                    <div
                      key={room.roomid}
                      className="p-3 border rounded-lg transition-all duration-200 hover:border-primary/50 hover:shadow-sm group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{room.roomid}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {getStateBadge(room.state)}
                            {room.lock && <Badge variant="destructive">锁定</Badge>}
                            {room.cycle && <Badge variant="outline">循环</Badge>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate(`/public/room/${room.roomid}`)}
                            title="访客视图"
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>房主: {room.host?.name || '未知'} (ID: {room.host?.id || '-'})</div>
                        <div className="flex items-center gap-2">
                          <Music className="h-3 w-3" />
                          <span>
                            {chartInfo ? (
                              <span className="text-foreground">
                                {chartInfo.name}
                                <span className="text-muted-foreground ml-1">
                                  [{chartInfo.level}] by {chartInfo.charter}
                                </span>
                              </span>
                            ) : room.chart?.id ? (
                              <span>谱面 ID: {room.chart.id}</span>
                            ) : (
                              <span className="text-muted-foreground">未选择谱面</span>
                            )}
                          </span>
                        </div>
                        <div>玩家: {room.players?.length || 0}人</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
