import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Play, 
  Download, 
  Trash2, 
  RefreshCw,
  Film,
  Key,
  FileAudio,
  Music,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiService } from '@/services/api';
import { phiraApiService } from '@/services/phiraApi';
import { toast } from 'sonner';
import type { PublicRoom, ReplayAuthResponse, ReplayChart } from '@/types/api';
import type { ChartInfo } from '@/services/phiraApi';

// 谱面信息缓存
const chartCache = new Map<number, ChartInfo>();

export function PublicApiPanel() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [replayData, setReplayData] = useState<ReplayAuthResponse | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [expandedCharts, setExpandedCharts] = useState<Set<number>>(new Set());
  const [chartInfos, setChartInfos] = useState<Map<number, ChartInfo>>(chartCache);

  // 从本地存储加载配置
  useEffect(() => {
    const savedUrl = localStorage.getItem('api_base_url') || '';
    const savedToken = localStorage.getItem('api_admin_token') || '';
    const savedUseToken = localStorage.getItem('api_use_token') !== 'false';
    
    apiService.setConfig({
      baseUrl: savedUrl,
      adminToken: savedUseToken ? savedToken : '',
    });

    // 自动加载房间列表
    if (savedUrl) {
      fetchRooms();
    }
  }, []);

  // 加载谱面信息
  const loadChartInfo = useCallback(async (chartId: number) => {
    if (chartCache.has(chartId)) {
      return chartCache.get(chartId)!;
    }
    try {
      const info = await phiraApiService.getChartInfo(chartId);
      chartCache.set(chartId, info);
      setChartInfos(new Map(chartCache));
      return info;
    } catch {
      return null;
    }
  }, []);

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
      
      toast.success(`获取到 ${data.total} 个房间`);
    } catch (error) {
      toast.error('获取房间列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReplayAuth = async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return;
    }

    // 如果没有输入token，尝试使用登录的token
    let tokenToUse = userToken;
    if (!tokenToUse) {
      const phiraToken = phiraApiService.getUserToken();
      if (phiraToken) {
        tokenToUse = phiraToken;
      }
    }

    if (!tokenToUse) {
      toast.error('请输入用户 TOKEN 或先登录 Phira 账号');
      return;
    }

    try {
      const data = await apiService.replayAuth(tokenToUse);
      if (data.ok) {
        setReplayData(data);
        setSessionToken(data.sessionToken);
        toast.success('认证成功');
        
        // 预加载谱面信息
        data.charts?.forEach((chart: ReplayChart) => {
          loadChartInfo(chart.chartId);
        });
      } else {
        toast.error('认证失败: ' + (data as any).error);
      }
    } catch (error) {
      toast.error('认证请求失败');
    }
  };

  const handleDownloadReplay = (chartId: number, timestamp: number) => {
    const url = apiService.getReplayDownloadUrl(sessionToken, chartId, timestamp);
    window.open(url, '_blank');
  };

  const handleDeleteReplay = async (chartId: number, timestamp: number) => {
    try {
      const result = await apiService.deleteReplay(sessionToken, chartId, timestamp);
      if (result.ok) {
        toast.success('回放已删除');
        handleReplayAuth();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除请求失败');
    }
  };

  const toggleChartExpand = (chartId: number) => {
    setExpandedCharts(prev => {
      const next = new Set(prev);
      if (next.has(chartId)) {
        next.delete(chartId);
      } else {
        next.add(chartId);
      }
      return next;
    });
  };

  const getStateBadge = (state: string) => {
    const stateMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'select_chart': { label: '选谱', variant: 'secondary' },
      'playing': { label: '游戏中', variant: 'default' },
      'waiting': { label: '等待中', variant: 'outline' },
      'waiting_for_ready': { label: '准备中', variant: 'secondary' },
    };
    const config = stateMap[state] || { label: state, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 房间列表 */}
      <div className="animate-slide-in">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                房间列表
              </div>
              <Button size="sm" onClick={fetchRooms} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardTitle>
            <CardDescription>获取当前所有房间的基本信息（无需鉴权）</CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无房间数据，点击刷新获取
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {rooms.map((room, index) => {
                    const chartId = Number(room.chart?.id);
                    const chartInfo = chartInfos.get(chartId);
                    
                    return (
                      <div
                        key={room.roomid}
                        className="p-3 border rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-sm"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{room.roomid}</span>
                          <div className="flex gap-1">
                            {getStateBadge(room.state)}
                            {room.lock && <Badge variant="destructive" className="text-xs">锁定</Badge>}
                            {room.cycle && <Badge variant="outline" className="text-xs">循环</Badge>}
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
                          <div className="flex items-center gap-2">
                            <span>玩家: {room.players?.length || 0}人</span>
                            {room.players && room.players.length > 0 && (
                              <span className="text-xs">
                                ({room.players.map(p => p.name).join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 谱面回放 */}
      <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              谱面回放
            </CardTitle>
            <CardDescription>查看和下载用户的游戏回放记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userToken" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                用户 TOKEN
              </Label>
              <div className="flex gap-2">
                <Input
                  id="userToken"
                  placeholder="输入 Phira 用户 TOKEN（留空使用登录账号）"
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value)}
                />
                <Button onClick={handleReplayAuth}>
                  <Play className="h-4 w-4 mr-2" />
                  认证
                </Button>
              </div>
            </div>

            {replayData && replayData.charts && replayData.charts.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">用户 ID: {replayData.userId}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    过期: {new Date(replayData.expiresAt).toLocaleString()}
                  </span>
                </div>
                
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {replayData.charts.map((chart: ReplayChart) => {
                      const chartInfo = chartInfos.get(chart.chartId);
                      const isExpanded = expandedCharts.has(chart.chartId);
                      
                      return (
                        <div
                          key={chart.chartId}
                          className="p-3 border rounded-lg transition-all duration-200"
                        >
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleChartExpand(chart.chartId)}
                          >
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {chartInfo ? chartInfo.name : `谱面 ID: ${chart.chartId}`}
                              </span>
                              {chartInfo && (
                                <Badge variant="secondary" className="text-xs">
                                  {chartInfo.level}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{chart.replays.length} 个回放</Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-3 space-y-2 animate-fade-in">
                              {chartInfo && (
                                <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
                                  <div>谱师: {chartInfo.charter}</div>
                                  <div>曲师: {chartInfo.composer}</div>
                                  <div>难度: {chartInfo.difficulty.toFixed(1)}</div>
                                </div>
                              )}
                              {chart.replays.map((replay) => (
                                <div
                                  key={replay.timestamp}
                                  className="flex items-center justify-between p-2 bg-muted rounded transition-colors hover:bg-muted/80"
                                >
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileAudio className="h-4 w-4" />
                                    <span>{new Date(replay.timestamp).toLocaleString()}</span>
                                    <Badge variant="outline" className="text-xs">
                                      ID: {replay.recordId}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleDownloadReplay(chart.chartId, replay.timestamp)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleDeleteReplay(chart.chartId, replay.timestamp)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {replayData && (!replayData.charts || replayData.charts.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                该用户暂无回放记录
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
