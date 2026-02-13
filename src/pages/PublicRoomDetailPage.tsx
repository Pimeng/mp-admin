import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Users,
  Crown,
  Gamepad2,
  Music,
  Lock,
  Unlock,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe
} from 'lucide-react';
import { apiService } from '@/services/api';
import { phiraApiService } from '@/services/phiraApi';
import { UserDetailDialog } from '@/components/UserDetailDialog';
import { ChartDetailDialog } from '@/components/ChartDetailDialog';
import type { PublicRoom } from '@/types/api';

interface ExtendedPublicRoom extends PublicRoom {
  max_users?: number;
  current_users?: number;
  monitors?: number;
}

export function PublicRoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ExtendedPublicRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 用户详情弹窗状态
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  
  // 谱面详情弹窗状态
  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

  // 获取房间数据
  const fetchRoomDetail = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getRooms();
      const foundRoom = data.rooms.find(r => r.roomid === roomId);
      if (foundRoom) {
        // 扩展公共房间数据（模拟一些额外字段用于展示）
        const extendedRoom: ExtendedPublicRoom = {
          ...foundRoom,
          max_users: 8, // 默认值
          current_users: foundRoom.players?.length || 0,
          monitors: 0, // 公共API不提供此数据
        };
        setRoom(extendedRoom);

        // 可选：预加载房主和谱面信息到缓存
        const hostId = parseInt(foundRoom.host.id, 10);
        if (!isNaN(hostId)) {
          phiraApiService.getUserInfoCached(hostId).catch(() => {});
        }

        const chartId = parseInt(foundRoom.chart.id, 10);
        if (!isNaN(chartId)) {
          phiraApiService.getChartInfoCached(chartId).catch(() => {});
        }
      } else {
        setError('房间不存在或已解散');
      }
    } catch (err) {
      setError('获取房间信息失败');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 初始加载
  useEffect(() => {
    fetchRoomDetail();
  }, [fetchRoomDetail]);

  // 自动刷新（每5秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomDetail();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomDetail]);

  const getStateBadge = (state: string) => {
    const stateMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'select_chart': { label: '选谱中', variant: 'secondary' },
      'playing': { label: '游戏中', variant: 'default' },
      'waiting': { label: '等待中', variant: 'outline' },
      'waiting_for_ready': { label: '准备中', variant: 'secondary' },
    };
    const config = stateMap[state] || { label: state, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (connected: boolean = true) => {
    return connected ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-gray-400" />
    );
  };

  const handleOpenUserDetail = (userId: number) => {
    setSelectedUserId(userId);
    setUserDialogOpen(true);
  };

  const handleOpenChartDetail = (chartId: number) => {
    setSelectedChartId(chartId);
    setChartDialogOpen(true);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className={`h-8 w-8 mx-auto mb-4 ${loading ? 'animate-spin' : ''}`} />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-bold">房间详情</h1>
                <p className="text-sm text-muted-foreground">{room.roomid}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStateBadge(room.state)}
              {room.lock ? (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  锁定
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Unlock className="h-3 w-3" />
                  开放
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                访客视图
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 房间概览 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  房间概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">最大人数</div>
                    <div className="text-lg font-semibold">{room.max_users}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">当前玩家</div>
                    <div className="text-lg font-semibold">{room.current_users}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">观战者</div>
                    <div className="text-lg font-semibold">{room.monitors}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">循环模式</div>
                    <div className="text-lg font-semibold">{room.cycle ? '开启' : '关闭'}</div>
                  </div>
                </div>

                <Separator />

                {/* 房主信息 - 可点击卡片 */}
                <div
                  className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors group"
                  onClick={() => handleOpenUserDetail(parseInt(room.host.id, 10))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">房主:</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{room.host.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium block">{room.host.name}</span>
                          <span className="text-xs text-muted-foreground">ID: {room.host.id}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      点击查看详情 →
                    </span>
                  </div>
                </div>

                {/* 谱面信息 - 可点击卡片 */}
                <div
                  className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors group"
                  onClick={() => handleOpenChartDetail(parseInt(room.chart.id, 10))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">当前谱面:</span>
                      <div>
                        <span className="font-medium block">{room.chart.name}</span>
                        <span className="text-xs text-muted-foreground">ID: {room.chart.id}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      点击查看详情 →
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 玩家列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  玩家列表 ({room.players?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.players?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无玩家
                  </div>
                ) : (
                  <div className="space-y-2">
                    {room.players?.map((player) => (
                      <div
                        key={player.id}
                        className="p-3 border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => handleOpenUserDetail(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(true)}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {player.name}
                              {room.host.id === String(player.id) && (
                                <Badge variant="outline" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                                  房主
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {player.id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <span className="text-green-600">在线</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground mt-1">
                            点击查看详情
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：信息面板 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={fetchRoomDetail}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  刷新数据
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  数据每 5 秒自动刷新
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>房间状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">锁定状态</span>
                    <span>{room.lock ? '已锁定' : '未锁定'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">循环模式</span>
                    <span>{room.cycle ? '开启' : '关闭'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前状态</span>
                    <span>{getStateBadge(room.state)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 提示信息 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <Globe className="h-4 w-4 inline mr-1" />
                这是访客视图，仅显示公开信息。
                如需查看完整房间信息（如观战者、游戏进度、历史记录等），请使用管理员账号登录。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 用户详情弹窗 - 访客模式（只读） */}
      <UserDetailDialog
        userId={selectedUserId || 0}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        readOnly={true}
      />

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
