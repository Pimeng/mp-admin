import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  FileAudio,
  Music,
  ChevronDown,
  ChevronUp,
  Globe,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { phiraApiService } from '@/services/phiraApi';
import { toast } from 'sonner';
import { ChartDetailDialog } from '@/components/ChartDetailDialog';
import { LoginDialog } from '@/components/LoginDialog';
import type { PublicRoom, ReplayAuthResponse, ReplayChart } from '@/types/api';
import type { ChartInfo } from '@/services/phiraApi';

// 谱面信息缓存
const chartCache = new Map<number, ChartInfo>();

export function PublicApiPanel() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [replayData, setReplayData] = useState<ReplayAuthResponse | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [expandedCharts, setExpandedCharts] = useState<Set<number>>(new Set());
  const [chartInfos, setChartInfos] = useState<Map<number, ChartInfo>>(chartCache);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const [autoLoading, setAutoLoading] = useState(false);
  
  // 谱面详情弹窗状态
  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

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

    // 检查登录状态并自动获取回放
    const token = phiraApiService.getUserToken();
    const uid = phiraApiService.getUserId();
    
    if (token && uid) {
      setIsLoggedIn(true);
      setUserId(uid);
      
      // 获取用户信息
      apiService.getCurrentUser().then((userInfo) => {
        setUserName(userInfo.name);
      }).catch(() => {
        // 获取失败时不影响其他功能
      });
      
      // 如果API已配置，自动获取回放
      if (savedUrl) {
        setAutoLoading(true);
        apiService.replayAuth(token).then((data) => {
          if (data.ok) {
            setReplayData(data);
            setSessionToken(data.sessionToken);
            toast.success(`已自动加载 ${data.charts?.length || 0} 个谱面的回放记录`);
            // 预加载谱面信息
            data.charts?.forEach((chart: ReplayChart) => {
              loadChartInfo(chart.chartId);
            });
          }
        }).catch((err) => {
          console.error('[PublicApiPanel] 自动获取回放失败:', err);
        }).finally(() => {
          setAutoLoading(false);
        });
      }
    }
  }, []);

  // 监听登录成功事件，自动更新回放列表
  useEffect(() => {
    const handleReplayAuthSuccess = (event: CustomEvent<ReplayAuthResponse>) => {
      const data = event.detail;
      setReplayData(data);
      setSessionToken(data.sessionToken);
      
      // 预加载谱面信息
      data.charts?.forEach((chart: ReplayChart) => {
        loadChartInfo(chart.chartId);
      });
    };

    window.addEventListener('replayAuthSuccess', handleReplayAuthSuccess as EventListener);
    return () => {
      window.removeEventListener('replayAuthSuccess', handleReplayAuthSuccess as EventListener);
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

  const handleLoginSuccess = () => {
    const token = phiraApiService.getUserToken();
    const uid = phiraApiService.getUserId();
    if (token && uid) {
      setIsLoggedIn(true);
      setUserId(uid);
      // 获取用户信息
      apiService.getCurrentUser().then((userInfo) => {
        setUserName(userInfo.name);
      }).catch(() => {
        // 获取失败时不影响其他功能
      });
      // 登录成功后自动获取回放
      handleFetchReplay();
    }
  };

  const handleLogout = () => {
    phiraApiService.clearAuth();
    setIsLoggedIn(false);
    setUserId(0);
    setUserName('');
    setReplayData(null);
    setSessionToken('');
    toast.success('已退出登录');
  };

  const handleFetchReplay = async () => {
    const config = apiService.getConfig();
    if (!config.baseUrl) {
      toast.error('请先配置 API 地址');
      return;
    }

    const tokenToUse = phiraApiService.getUserToken();
    if (!tokenToUse) {
      toast.error('请先登录 Phira 账号');
      return;
    }

    setAutoLoading(true);
    try {
      const data = await apiService.replayAuth(tokenToUse);
      if (data.ok) {
        setReplayData(data);
        setSessionToken(data.sessionToken);
        toast.success(`已加载 ${data.charts?.length || 0} 个谱面的回放记录`);
        // 预加载谱面信息
        data.charts?.forEach((chart: ReplayChart) => {
          loadChartInfo(chart.chartId);
        });
      } else {
        toast.error('获取回放失败');
      }
    } catch {
      toast.error('获取回放请求失败');
    } finally {
      setAutoLoading(false);
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
        handleFetchReplay();
      } else {
        toast.error('删除失败');
      }
    } catch {
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

  const handleOpenChartDetail = (chartId: number) => {
    setSelectedChartId(chartId);
    setChartDialogOpen(true);
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
              <ScrollArea className="h-[400px]">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {isLoggedIn ? (
                  <span className="text-sm">
                    已登录 <span className="font-medium">{userName || `用户 ${userId}`}</span>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">未登录</span>
                )}
              </div>
              <div className="flex gap-2">
                {isLoggedIn ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleFetchReplay} 
                      disabled={autoLoading}
                    >
                      <Play className={`h-4 w-4 mr-2 ${autoLoading ? 'animate-spin' : ''}`} />
                      {autoLoading ? '加载中...' : '获取回放'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      退出
                    </Button>
                  </>
                ) : (
                  <LoginDialog onLoginSuccess={handleLoginSuccess}>
                    <Button size="sm">
                      <LogIn className="h-4 w-4 mr-2" />
                      登录
                    </Button>
                  </LoginDialog>
                )}
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
                              <span 
                                className="font-medium hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenChartDetail(chart.chartId);
                                }}
                              >
                                {chartInfo ? chartInfo.name : `谱面 ID: ${chart.chartId}`}
                              </span>
                              {chartInfo && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs hover:bg-secondary/80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenChartDetail(chart.chartId);
                                  }}
                                >
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

      {/* 谱面详情弹窗 */}
      {selectedChartId && (
        <ChartDetailDialog
          chartId={selectedChartId}
          open={chartDialogOpen}
          onOpenChange={setChartDialogOpen}
        />
      )}
    </div>
  );
}
