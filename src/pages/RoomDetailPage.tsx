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
  Clock,
  CheckCircle,
  XCircle,
  Monitor,
  RefreshCw,
  Trash2,
  MessageSquare,
  Settings,
  ExternalLink,
  Loader2,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiService } from '@/services/api';
import { phiraApiService, type UserDetailInfo, type ChartInfo } from '@/services/phiraApi';
import { webSocketService } from '@/services/websocket';
import { toast } from 'sonner';
import { UserDetailDialog } from '@/components/UserDetailDialog';
import { ChartDetailDialog } from '@/components/ChartDetailDialog';
import { RecordDetailDialog } from '@/components/RecordDetailDialog';
import type { Room } from '@/types/api';

interface MonitorInfo {
  name?: string;
  id?: number;
}

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
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

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

  const handleOpenRecordDetail = (recordId: number) => {
    setSelectedRecordId(recordId);
    setRecordDialogOpen(true);
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

                <Separator />

                {/* 房主信息 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">房主:</span>
                    {loadingHost ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : hostInfo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={hostInfo.avatar} alt={hostInfo.name} />
                          <AvatarFallback>{hostInfo.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{hostInfo.name}</span>
                        <span className="text-sm text-muted-foreground">(ID: {room.host?.id})</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={handleOpenHostProfile}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          主页
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room.host?.name || '未知'}</span>
                        <span className="text-sm text-muted-foreground">(ID: {room.host?.id || '-'})</span>
                      </div>
                    )}
                  </div>

                  {/* 谱面信息 */}
                  <div className="flex items-center gap-3">
                    <Music className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">当前谱面:</span>
                    {loadingChart ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : chartInfo ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chartInfo.name}</span>
                        <span className={`text-sm font-semibold ${getDifficultyColor(chartInfo.difficulty)}`}>
                          {chartInfo.level}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={handleOpenChartDetail}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          详情
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{room.chart?.name || '未选择'}</span>
                    )}
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

            {/* 玩家列表 */}
            <Card>
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
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {room.users?.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                          onClick={() => handleOpenUserDetail(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(user.connected)}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {user.name}
                                {user.is_host && (
                                  <Badge variant="outline" className="text-xs">
                                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                                    房主
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user.id} | 语言: {user.language || '未知'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {user.connected ? (
                              <span className="text-green-600">在线</span>
                            ) : (
                              <span className="text-gray-400">离线</span>
                            )}
                            {user.game_time !== undefined && user.game_time !== -Infinity && (
                              <div className="text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {user.game_time}ms
                              </div>
                            )}
                            {user.finished && (
                              <div className="text-green-600 text-xs">已完成</div>
                            )}
                            {user.aborted && (
                              <div className="text-red-600 text-xs">已中止</div>
                            )}
                            {user.record_id && (
                              <div 
                                className="text-blue-600 text-xs cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRecordDetail(user.record_id!);
                                }}
                              >
                                成绩ID: {user.record_id} (点击查看)
                              </div>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground mt-1">
                              点击查看详情
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* 观战者列表 */}
            {room.monitors && room.monitors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    观战者列表 ({room.monitors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {room.monitors.map((monitor: unknown, index: number) => {
                        const monitorInfo = monitor as MonitorInfo;
                        return (
                          <div
                            key={index}
                            className="p-3 border rounded-lg text-sm"
                          >
                            {typeof monitor === 'object' && monitor !== null ? (
                              <div className="flex items-center justify-between">
                                <span>{monitorInfo.name || `观战者 ${index + 1}`}</span>
                                <span className="text-muted-foreground">ID: {monitorInfo.id || '-'}</span>
                              </div>
                            ) : (
                              <span>观战者 {index + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：操作面板 */}
          <div className="space-y-6">
            <Card>
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
                  variant="outline" 
                  className="w-full" 
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
                  <Users className="h-4 w-4 mr-2" />
                  修改最大人数
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

            {/* 公屏消息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  公屏消息 ({chatMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={chatScrollRef}
                  className="h-[200px] overflow-y-auto space-y-2 pr-2"
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      暂无消息
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg text-sm ${
                          msg.user === 0 
                            ? 'bg-blue-50 dark:bg-blue-950' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            msg.user === 0 ? 'text-blue-600' : 'text-foreground'
                          }`}>
                            {msg.user === 0 ? '系统' : `玩家 ${msg.user}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                          </span>
                        </div>
                        <div className="break-words">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  发送消息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm"
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
                  发送消息
                </Button>
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
                    <span>{room.locked ? '已锁定' : '未锁定'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">循环模式</span>
                    <span>{room.cycle ? '开启' : '关闭'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Live模式</span>
                    <span>{room.live ? '开启' : '关闭'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">实时更新</span>
                    <span className={wsSubscribed ? 'text-green-600' : wsConnected ? 'text-yellow-600' : 'text-gray-400'}>
                      {wsSubscribed ? '已连接' : wsConnected ? '未授权' : '未连接'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 房主详细信息卡片 */}
            {hostInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    房主信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            )}

            {/* 谱面信息卡片 */}
            {chartInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    谱面信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            )}
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

      {/* 成绩详情弹窗 */}
      {selectedRecordId && (
        <RecordDetailDialog
          recordId={selectedRecordId}
          open={recordDialogOpen}
          onOpenChange={setRecordDialogOpen}
        />
      )}
    </div>
  );
}
