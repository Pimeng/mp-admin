import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  Gamepad2, 
  Music,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  MessageSquare,
  Settings,
  ExternalLink,
  Loader2,
  User,
  Wifi,
  WifiOff,
  Send
} from 'lucide-react';
import { apiService } from '@/services/api';
import { phiraApiService, type UserDetailInfo, type ChartInfo } from '@/services/phiraApi';
import { webSocketService } from '@/services/websocket';
import { toast } from 'sonner';
import { UserDetailDialog } from '@/components/UserDetailDialog';
import { ChartDetailDialog } from '@/components/ChartDetailDialog';
import { GameResultsDialog } from '@/components/GameResultsDialog';
import type { Room } from '@/types/api';



interface ChatMessage {
  user: number;
  content: string;
  timestamp: number;
}

interface RoomLogMessage {
  message: string;
  timestamp: number;
}

export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hostInfo, setHostInfo] = useState<UserDetailInfo | null>(null);
  const [chartInfo, setChartInfo] = useState<ChartInfo | null>(null);
  const [loadingHost, setLoadingHost] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSubscribed, setWsSubscribed] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // 弹窗状态
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

  const [gameResultsOpen, setGameResultsOpen] = useState(false);
  const [gameFinishedPlayers, setGameFinishedPlayers] = useState<{ userId: number; userName: string; recordId?: number }[]>([]);
  const previousStateRef = useRef<string>('');
  // 使用 ref 来存储玩家成绩，避免重复渲染问题
  const playerRecordsRef = useRef<Map<number, { userId: number; userName: string; recordId?: number }>>(new Map());

  // 初始加载房间数据
  const fetchRoomDetail = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        const foundRoom = data.rooms.find(r => r.roomid === roomId);
        if (foundRoom) {
          setRoom(foundRoom);
          // 获取房主信息
          if (foundRoom.host?.id) {
            fetchHostInfo(foundRoom.host.id);
          }
          // 获取谱面信息
          if (foundRoom.chart?.id) {
            fetchChartInfo(foundRoom.chart.id);
          }
        } else {
          toast.error('房间不存在');
          navigate('/');
        }
      } else {
        toast.error('获取房间信息失败');
      }
    } catch {
      toast.error('请求失败，请检查 TOKEN 是否有效');
    } finally {
      setLoading(false);
    }
  }, [roomId, navigate]);

  const fetchHostInfo = async (hostId: number) => {
    setLoadingHost(true);
    try {
      const info = await phiraApiService.getUserInfoCached(hostId);
      if (info) {
        setHostInfo(info);
      }
    } catch {
      // 静默失败，不影响主页面
    } finally {
      setLoadingHost(false);
    }
  };

  const fetchChartInfo = async (chartId: number) => {
    setLoadingChart(true);
    try {
      const info = await phiraApiService.getChartInfoCached(chartId);
      if (info) {
        setChartInfo(info);
      }
    } catch {
      // 静默失败，不影响主页面
    } finally {
      setLoadingChart(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchRoomDetail();
  }, [fetchRoomDetail]);

  // 初始化状态引用 - 在获取到房间数据时设置
  useEffect(() => {
    if (room) {
      // 只有当状态真正变化时才更新 ref
      if (previousStateRef.current !== room.state.type) {
        console.log('[GameResults] 初始化/更新状态:', previousStateRef.current, '->', room.state.type);
        previousStateRef.current = room.state.type;
      }
    }
  }, [room?.roomid, room?.state.type]);

  // WebSocket 连接和订阅
  useEffect(() => {
    if (!roomId) return;

    const baseUrl = apiService.getBaseUrl();
    if (!baseUrl) return;

    // 设置 WebSocket URL
    webSocketService.setBaseUrl(baseUrl);

    // 连接 WebSocket
    webSocketService.connect().then(() => {
      console.log('WebSocket connected, subscribing as admin');
      // 使用管理员订阅获取所有房间更新
      webSocketService.adminSubscribe();
    }).catch((error) => {
      console.error('WebSocket connection failed:', error);
    });

    // 监听连接状态
    const unsubscribeConnect = webSocketService.onConnect(() => {
      setWsConnected(true);
      // 连接成功后订阅管理员频道
      webSocketService.adminSubscribe();
    });

    const unsubscribeDisconnect = webSocketService.onDisconnect(() => {
      setWsConnected(false);
      setWsSubscribed(false);
    });

    // 监听订阅状态
    const unsubscribeSubscribe = webSocketService.onSubscribe((success) => {
      setWsSubscribed(success);
      if (success) {
        toast.success('WebSocket 已连接');
      } else {
        toast.error('WebSocket 订阅失败，请检查管理员 Token');
      }
    });

    // 监听消息
    const unsubscribeMessage = webSocketService.onMessage((message) => {
      if (message.type === 'admin_update') {
        const adminMessage = message as unknown as { data: { changes: { rooms: Room[] } } };
        const updatedRoom = adminMessage.data.changes.rooms.find(r => r.roomid === roomId);
        if (updatedRoom) {
          // 检测游戏状态变化：从 playing 变为 waiting 或 select_chart，表示游戏结束
          const prevState = previousStateRef.current;
          const currentState = updatedRoom.state.type;

          console.log('[GameResults] 状态检测:', { prevState, currentState, roomId: updatedRoom.roomid });

          // 持续收集玩家成绩（在游戏进行中时就开始收集）
          if (currentState === 'playing') {
            updatedRoom.users.forEach(u => {
              // 如果玩家有 record_id 且还没有被记录
              if (u.record_id && !playerRecordsRef.current.has(u.id)) {
                console.log('[GameResults] 收集到玩家成绩:', { userId: u.id, userName: u.name, recordId: u.record_id });
                playerRecordsRef.current.set(u.id, {
                  userId: u.id,
                  userName: u.name,
                  recordId: u.record_id,
                });
              }
            });
          }

          // 先更新 ref，确保下一次比较时是正确的状态
          const oldState = previousStateRef.current;
          previousStateRef.current = currentState;

          // 确保 prevState 已初始化且状态发生变化
          if (oldState && oldState !== currentState) {
            console.log('[GameResults] 状态变化:', oldState, '->', currentState);

            // 检测游戏结束：从 playing 变为 waiting 或 select_chart
            if (oldState === 'playing' && (currentState === 'waiting' || currentState === 'select_chart')) {
              console.log('[GameResults] 游戏结束 detected!');

              // 游戏结束，使用收集到的所有成绩
              const finishedPlayers = Array.from(playerRecordsRef.current.values());

              console.log('[GameResults] 收集到的玩家成绩:', finishedPlayers);

              if (finishedPlayers.length > 0) {
                setGameFinishedPlayers(finishedPlayers);
                setGameResultsOpen(true);
                console.log('[GameResults] 弹窗已打开');
              } else {
                console.log('[GameResults] 没有收集到玩家成绩，不显示弹窗');
              }

              // 清空收集的成绩，为下一局做准备
              playerRecordsRef.current.clear();
            }

            // 如果状态变为 playing，清空上一局的成绩记录
            if (currentState === 'playing') {
              console.log('[GameResults] 新游戏开始，清空成绩记录');
              playerRecordsRef.current.clear();
            }
          }

          setRoom(updatedRoom);

          // 更新房主信息
          if (updatedRoom.host?.id && updatedRoom.host.id !== hostInfo?.id) {
            fetchHostInfo(updatedRoom.host.id);
          }
          // 更新谱面信息
          if (updatedRoom.chart?.id && updatedRoom.chart.id !== chartInfo?.id) {
            fetchChartInfo(updatedRoom.chart.id);
          }
        }
      }

      // 处理公屏消息
      if (message.type === 'room_message') {
        const roomMsg = message as unknown as { data: ChatMessage };
        setChatMessages(prev => [...prev, {
          user: roomMsg.data.user,
          content: roomMsg.data.content,
          timestamp: roomMsg.data.timestamp,
        }]);
      }

      // 处理房间日志消息
      if (message.type === 'room_log') {
        const logMsg = message as unknown as { data: RoomLogMessage };
        setChatMessages(prev => [...prev, {
          user: 0, // 系统消息
          content: logMsg.data.message,
          timestamp: logMsg.data.timestamp,
        }]);
      }
    });

    // 初始连接状态
    setWsConnected(webSocketService.isConnected());

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeSubscribe();
      unsubscribeMessage();
      webSocketService.adminUnsubscribe();
      // 重置状态引用和成绩记录，下次进入房间时重新初始化
      previousStateRef.current = '';
      playerRecordsRef.current.clear();
    };
  }, [roomId]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleDisbandRoom = async () => {
    if (!roomId) return;
    
    const result = await Swal.fire({
      title: '确认解散房间?',
      text: `您确定要解散房间 ${roomId} 吗？此操作不可撤销！`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '确认解散',
      cancelButtonText: '取消',
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const apiResult = await apiService.disbandRoom(roomId);
      if (apiResult.ok) {
        toast.success(`房间 ${roomId} 已解散`);
        navigate('/');
      } else {
        toast.error('解散失败');
      }
    } catch {
      toast.error('请求失败');
    }
  };

  const handleSendRoomChat = async () => {
    if (!roomId || !message) {
      toast.error('请输入消息内容');
      return;
    }
    try {
      const result = await apiService.sendRoomChat(roomId, message);
      if (result.ok) {
        toast.success('消息已发送');
        setMessage('');
      } else {
        toast.error('发送失败');
      }
    } catch {
      toast.error('请求失败');
    }
  };

  const handleOpenUserDetail = (userId: number) => {
    setSelectedUserId(userId);
    setUserDialogOpen(true);
  };



  const handleOpenChartDetail = () => {
    if (room?.chart?.id) {
      setChartDialogOpen(true);
    }
  };

  const handleOpenHostProfile = () => {
    if (room?.host?.id) {
      window.open(`https://phira.moe/user/${room.host.id}`, '_blank');
    }
  };

  const getStateBadge = (type: string) => {
    const stateMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'select_chart': { label: '选谱中', variant: 'secondary' },
      'playing': { label: '游戏中', variant: 'default' },
      'waiting': { label: '等待中', variant: 'outline' },
      'waiting_for_ready': { label: '准备中', variant: 'secondary' },
    };
    const config = stateMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 15) return 'text-red-500';
    if (difficulty >= 13) return 'text-purple-500';
    if (difficulty >= 10) return 'text-blue-500';
    if (difficulty >= 7) return 'text-green-500';
    return 'text-gray-500';
  };

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
              {getStateBadge(room.state.type)}
              {room.locked && <Badge variant="destructive">锁定</Badge>}
              {room.cycle && <Badge variant="outline">循环</Badge>}
              {wsSubscribed ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Wifi className="h-3 w-3 mr-1" />
                  实时
                </Badge>
              ) : wsConnected ? (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <WifiOff className="h-3 w-3 mr-1" />
                  未授权
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                  <WifiOff className="h-3 w-3 mr-1" />
                  离线
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 第一行：房间概览(2列) + 房间操作(1列) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 左侧：房间概览（占2列） */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  房间概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 第一排：人数相关 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div 
                    className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group"
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: '修改最大人数',
                        input: 'number',
                        inputLabel: '请输入新的最大人数',
                        inputValue: room?.max_users?.toString() || '8',
                        inputAttributes: {
                          min: '1',
                          max: '64',
                          step: '1'
                        },
                        showCancelButton: true,
                        confirmButtonText: '确认',
                        cancelButtonText: '取消',
                        inputValidator: (value) => {
                          if (!value) {
                            return '请输入人数';
                          }
                          const num = parseInt(value, 10);
                          if (num < 1 || num > 64) {
                            return '最大人数必须在 1-64 之间';
                          }
                          return null;
                        }
                      });
                      
                      if (result.isConfirmed && result.value) {
                        const maxUsers = parseInt(result.value, 10);
                        try {
                          const apiResult = await apiService.setRoomMaxUsers(roomId!, maxUsers);
                          if (apiResult.ok) {
                            toast.success(`最大人数已设置为 ${maxUsers}`);
                            fetchRoomDetail();
                          } else {
                            toast.error('设置失败');
                          }
                        } catch {
                          toast.error('请求失败');
                        }
                      }
                    }}
                  >
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      最大人数
                      <Settings className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-lg font-semibold">{room.max_users}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">当前玩家</div>
                    <div className="text-lg font-semibold">{room.users?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">观战者</div>
                    <div className="text-lg font-semibold">{room.monitors?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Live</div>
                    <div className="text-lg font-semibold">{room.live ? '是' : '否'}</div>
                  </div>
                </div>

                {/* 第二排：状态相关 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">锁定状态</div>
                    <div className="text-lg font-semibold">{room.locked ? '已锁定' : '未锁定'}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">循环模式</div>
                    <div className="text-lg font-semibold">{room.cycle ? '开启' : '关闭'}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">实时更新</div>
                    <div className={`text-lg font-semibold ${wsSubscribed ? 'text-green-600' : wsConnected ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {wsSubscribed ? '已连接' : wsConnected ? '未授权' : '未连接'}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">房间状态</div>
                    <div className="text-lg font-semibold">
                      {room.state?.type === 'select_chart' ? '选谱中' : 
                       room.state?.type === 'playing' ? '游戏中' : '等待中'}
                    </div>
                  </div>
                </div>

                {room.state?.type === 'playing' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">游戏进度</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div className="text-sm text-green-600 dark:text-green-400">已完成</div>
                          <div className="text-lg font-semibold">{room.state.finished_users?.length || 0}</div>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <div className="text-sm text-red-600 dark:text-red-400">已中止</div>
                          <div className="text-lg font-semibold">{room.state.aborted_users?.length || 0}</div>
                        </div>
                      </div>
                      {room.state.results_count !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          已上传成绩: {room.state.results_count} / 中止: {room.state.aborted_count || 0}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：房间操作（占1列） */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  房间操作
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
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleDisbandRoom}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  解散房间
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 第二行：房主信息(1列) + 谱面信息(1列) + 玩家列表(1列) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 房主信息 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                房主信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHost ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hostInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={hostInfo.avatar} alt={hostInfo.name} />
                      <AvatarFallback>{hostInfo.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{hostInfo.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {hostInfo.id}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-muted-foreground text-xs">RKS</div>
                      <div className="font-semibold">{hostInfo.rks?.toFixed(2)}</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-muted-foreground text-xs">粉丝</div>
                      <div className="font-semibold">{hostInfo.follower_count}</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleOpenHostProfile}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    访问主页
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="font-medium">{room.host?.name || '未知'}</div>
                  <div className="text-sm">ID: {room.host?.id || '-'}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 谱面信息 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                谱面信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : chartInfo ? (
                <div className="space-y-4">
                  {chartInfo.illustration && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={chartInfo.illustration}
                        alt={chartInfo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{chartInfo.name}</div>
                    <div className={`text-sm font-semibold ${getDifficultyColor(chartInfo.difficulty)}`}>
                      {chartInfo.level} (定数: {chartInfo.difficulty?.toFixed(1)})
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="text-muted-foreground">谱师: {chartInfo.charter}</div>
                    <div className="text-muted-foreground">曲师: {chartInfo.composer}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleOpenChartDetail}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {room.chart?.name || '未选择谱面'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 玩家列表 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                玩家列表 ({room.users?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {room.users?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无玩家
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {room.users?.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                        onClick={() => handleOpenUserDetail(user.id)}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.connected)}
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {user.name}
                              {user.is_host && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          {user.connected ? (
                            <span className="text-green-600">在线</span>
                          ) : (
                            <span className="text-gray-400">离线</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 第三行：公屏消息(2列) + 发送消息(1列) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：公屏消息（占2列） */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  公屏消息 ({chatMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={chatScrollRef}
                  className="h-[300px] overflow-y-auto space-y-2 pr-2"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      暂无消息
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg ${
                          msg.user === 0 
                            ? 'bg-blue-50 dark:bg-blue-950' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium text-sm ${
                            msg.user === 0 ? 'text-blue-600' : 'text-foreground'
                          }`}>
                            {msg.user === 0 ? '系统' : `玩家 ${msg.user}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-sm break-words">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：发送消息（占1列） */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  发送消息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full min-h-[200px] p-3 border rounded-md text-sm resize-none"
                  placeholder="输入消息内容（1-200字符）"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                />
                <Button 
                  className="w-full" 
                  onClick={handleSendRoomChat}
                  disabled={!message}
                >
                  <Send className="h-4 w-4 mr-2" />
                  发送消息
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 用户详情弹窗 */}
      <UserDetailDialog
        userId={selectedUserId || 0}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
      />

      {/* 谱面详情弹窗 */}
      {room.chart?.id && (
        <ChartDetailDialog
          chartId={room.chart.id}
          open={chartDialogOpen}
          onOpenChange={setChartDialogOpen}
        />
      )}

      {/* 游戏结束成绩统计弹窗 */}
      <GameResultsDialog
        open={gameResultsOpen}
        onOpenChange={setGameResultsOpen}
        playerRecordIds={gameFinishedPlayers}
      />
    </div>
  );
}
