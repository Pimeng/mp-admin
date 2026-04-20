import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Ban,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Settings,
  Volume2,
  UserX,
  Eye,
  Trophy,
  Play,
  CheckCircle,
  AlertCircle,
  List,
  Trash2
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { getStateBadgeConfig } from '@/lib/utils';
import type { Room, UserInfo } from '@/types/api';

const adminTabs = [
  { value: 'rooms', label: '\u623f\u95f4\u7ba1\u7406' },
  { value: 'users', label: '\u7528\u6237\u7ba1\u7406' },
  { value: 'messages', label: '\u6d88\u606f\u5e7f\u64ad' },
  { value: 'settings', label: '\u529f\u80fd\u5f00\u5173' },
  { value: 'contest', label: '\u6bd4\u8d5b' },
];

export function AdminApiPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [roomCreationEnabled, setRoomCreationEnabled] = useState(true);
  const [isRoomOptionsLoading, setIsRoomOptionsLoading] = useState(false);

  // 比赛相关状态
  const [contestEnabled, setContestEnabled] = useState(false);
  const [whitelist, setWhitelist] = useState('');
  const [force, setForce] = useState(false);
  const currentTab = location.pathname.split('/').filter(Boolean)[1] || 'rooms';
  const activeTab = adminTabs.some((tab) => tab.value === currentTab) ? currentTab : 'rooms';

  useEffect(() => {
    if (activeTab === 'messages') {
      void ensureAdminRoomsLoaded();
    }
  }, [activeTab]);

  const fetchAdminRooms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        setRooms(data.rooms || []);
        toast.success(`获取到 ${data.rooms.length} 个房间`);
      } else {
        const errorMsg = (data as any).error || '未知错误';
        if (errorMsg === 'unauthorized') {
          toast.error('管理员 TOKEN 无效或已过期，请重新配置');
        } else if (errorMsg === 'admin-disabled') {
          toast.error('服务器未配置管理员 TOKEN，无法使用管理功能');
        } else {
          toast.error('获取房间列表失败: ' + errorMsg);
        }
      }
    } catch (error) {
      toast.error('请求失败，请检查 API 地址和 TOKEN 是否有效');
    } finally {
      setLoading(false);
    }
  };

  const ensureAdminRoomsLoaded = async () => {
    if (rooms.length > 0 || isRoomOptionsLoading) {
      return;
    }

    setIsRoomOptionsLoading(true);
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        setRooms(data.rooms || []);
      } else {
        const errorMsg = (data as any).error || '未知错误';
        toast.error('获取房间列表失败: ' + errorMsg);
      }
    } catch {
      toast.error('获取房间列表失败');
    } finally {
      setIsRoomOptionsLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (!roomId.trim()) {
      return true;
    }

    const keyword = roomId.trim().toLowerCase();
    return (
      room.roomid.toLowerCase().includes(keyword) ||
      (room.host?.name || '').toLowerCase().includes(keyword)
    );
  });

  const handleSearchUser = async () => {
    if (!userId) {
      toast.error('请输入用户 ID');
      return;
    }
    try {
      const data = await apiService.getUser(Number(userId));
      if (data.ok) {
        setUserInfo(data.user);
      } else {
        toast.error('用户不存在');
      }
    } catch (error) {
      toast.error('查询失败');
    }
  };

  const handleBanUser = async (banned: boolean) => {
    if (!userId) {
      toast.error('请输入用户 ID');
      return;
    }
    try {
      const result = await apiService.banUser(Number(userId), banned, true);
      if (result.ok) {
        toast.success(banned ? '用户已封禁' : '用户已解封');
        handleSearchUser();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('请求失败');
    }
  };

  const handleDisconnectUser = async () => {
    if (!userId) {
      toast.error('请输入用户 ID');
      return;
    }
    try {
      const result = await apiService.disconnectUser(Number(userId));
      if (result.ok) {
        toast.success('用户已断开连接');
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      toast.error('请求失败');
    }
  };

  // 解散指定房间
  const handleDisbandRoomById = async (targetRoomId: string) => {
    try {
      const result = await apiService.disbandRoom(targetRoomId);
      if (result.ok) {
        toast.success(`房间 ${targetRoomId} 已解散`);
        // 刷新房间列表
        fetchAdminRooms();
      } else {
        const errorMsg = (result as any).error || '未知错误';
        toast.error('解散失败: ' + errorMsg);
      }
    } catch (error) {
      toast.error('请求失败');
    }
  };

  const handleBroadcast = async () => {
    if (!message) {
      toast.error('请输入广播内容');
      return;
    }
    try {
      const result = await apiService.broadcast(message);
      if (result.ok) {
        toast.success(`广播已发送至 ${result.rooms} 个房间`);
        setMessage('');
      } else {
        toast.error('广播失败');
      }
    } catch (error) {
      toast.error('请求失败');
    }
  };

  const handleSendRoomChat = async () => {
    if (!roomId || !message) {
      toast.error('请输入房间 ID 和消息内容');
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
    } catch (error) {
      toast.error('请求失败');
    }
  };

  const handleToggleReplay = async () => {
    try {
      const result = await apiService.setReplayConfig(!replayEnabled);
      if (result.ok) {
        setReplayEnabled(result.enabled);
        toast.success(`回放录制已${result.enabled ? '开启' : '关闭'}`);
      }
    } catch (error) {
      toast.error('设置失败');
    }
  };

  const handleToggleRoomCreation = async () => {
    try {
      const result = await apiService.setRoomCreationConfig(!roomCreationEnabled);
      if (result.ok) {
        setRoomCreationEnabled(result.enabled);
        toast.success(`房间创建已${result.enabled ? '开启' : '关闭'}`);
      }
    } catch (error) {
      toast.error('设置失败');
    }
  };

  // 比赛相关方法
  const parseWhitelist = (): number[] => {
    return whitelist
      .split(',')
      .map(id => id.trim())
      .filter(id => id !== '')
      .map(id => Number(id))
      .filter(id => !isNaN(id));
  };

  const handleConfigContest = async () => {
    if (!roomId) {
      toast.error('请输入房间 ID');
      return;
    }
    setLoading(true);
    try {
      const userIds = parseWhitelist();
      const result = await apiService.configContestRoom(roomId, contestEnabled, userIds);
      if (result.ok) {
        toast.success(`比赛模式已${contestEnabled ? '启用' : '关闭'}`);
      } else {
        toast.error('配置失败');
      }
    } catch (error) {
      toast.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhitelist = async () => {
    if (!roomId) {
      toast.error('请输入房间 ID');
      return;
    }
    setLoading(true);
    try {
      const userIds = parseWhitelist();
      const result = await apiService.updateWhitelist(roomId, userIds);
      if (result.ok) {
        toast.success('白名单已更新');
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartContest = async () => {
    if (!roomId) {
      toast.error('请输入房间 ID');
      return;
    }
    setLoading(true);
    try {
      const result = await apiService.startContest(roomId, force);
      if (result.ok) {
        toast.success('比赛已开始');
      } else {
        toast.error('开始失败');
      }
    } catch (error) {
      toast.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const getStateBadge = (type: string) => {
    const config = getStateBadgeConfig(type);
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => navigate(`/admin/${value}`)}
      className="w-full animate-fade-in"
    >
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="rooms">房间管理</TabsTrigger>
        <TabsTrigger value="users">用户管理</TabsTrigger>
        <TabsTrigger value="messages">消息广播</TabsTrigger>
        <TabsTrigger value="settings">功能开关</TabsTrigger>
        <TabsTrigger value="contest">比赛</TabsTrigger>
      </TabsList>

      <div className="animate-slide-in">
        {activeTab === 'rooms' && (
          <div className="space-y-4">
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
                  <Button size="sm" onClick={fetchAdminRooms} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                  </Button>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>查看所有房间的详细状态</span>
                  {rooms.length > 0 && (
                    <span className="text-muted-foreground">
                      | 总玩家数: {rooms.reduce((sum, room) => sum + (room.users?.length || 0), 0)} 人
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
                    {rooms.map((room, index) => (
                        <div
                          key={room.roomid}
                          className="p-3 border rounded-lg transition-all duration-200 hover:border-primary/50 hover:shadow-sm group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{room.roomid}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {getStateBadge(room.state.type)}
                                {room.locked && <Badge variant="destructive">锁定</Badge>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={() => handleDisbandRoomById(room.roomid)}
                                title="解散房间"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => navigate(`/room/${room.roomid}`)}
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>房主: {room.host?.name || '未知'} (ID: {room.host?.id || '-'})</div>
                            <div>谱面: {room.chart?.name || '未选择'}</div>
                            <div>玩家: {room.users?.length || 0}/{room.max_users || '-'}</div>
                            {room.state?.type === 'playing' && (
                              <div className="text-xs">
                                完成: {room.state.finished_users?.length || 0} / 
                                中止: {room.state.aborted_users?.length || 0}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  查询用户
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入用户 ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <Button onClick={handleSearchUser}>
                    <Search className="h-4 w-4 mr-2" />
                    查询
                  </Button>
                </div>

                {userInfo && (
                  <div className="p-4 border rounded-lg space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{userInfo.name}</span>
                      <div className="flex gap-1">
                        {userInfo.connected ? (
                          <Badge variant="default">在线</Badge>
                        ) : (
                          <Badge variant="secondary">离线</Badge>
                        )}
                        {userInfo.banned && <Badge variant="destructive">已封禁</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>ID: {userInfo.id}</div>
                      <div>房间: {userInfo.room || '无'}</div>
                      <div>观战模式: {userInfo.monitor ? '是' : '否'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  用户操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="destructive" onClick={() => handleBanUser(true)}>
                    <Ban className="h-4 w-4 mr-2" />
                    封禁用户
                  </Button>
                  <Button variant="outline" onClick={() => handleBanUser(false)}>
                    解封用户
                  </Button>
                </div>
                <Button variant="secondary" onClick={handleDisconnectUser} className="w-full">
                  <UserX className="h-4 w-4 mr-2" />
                  断开连接
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  全服广播
                </CardTitle>
                <CardDescription>向所有房间发送系统消息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>广播内容</Label>
                  <textarea
                    className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                    placeholder="输入广播消息（1-200字符）"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <Button onClick={handleBroadcast} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  发送广播
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  房间消息
                </CardTitle>
                <CardDescription>向指定房间发送消息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>房间 ID</Label>
                  <Input
                    placeholder="输入房间 ID"
                    list="admin-room-id-options"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onFocus={() => {
                      void ensureAdminRoomsLoaded();
                    }}
                  />
                  <datalist id="admin-room-id-options">
                    {filteredRooms.map((room) => (
                      <option key={room.roomid} value={room.roomid} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    {isRoomOptionsLoading ? '正在加载房间列表...' : '支持直接输入，也可以从浏览器补全结果里选择房间 ID'}
                  </p>
                  {false && (
                    <Select
                      value={rooms.some((room) => room.roomid === roomId) ? roomId : undefined}
                      onValueChange={setRoomId}
                      onOpenChange={(open) => {
                        if (open) {
                          void ensureAdminRoomsLoaded();
                        }
                      }}
                    >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={isRoomOptionsLoading ? '正在获取房间列表...' : '从已获取的房间中快速选择'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.length > 0 ? (
                        rooms.map((room) => (
                          <SelectItem key={room.roomid} value={room.roomid}>
                            {room.roomid}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty" disabled>
                          {isRoomOptionsLoading ? '正在加载房间列表...' : '暂无可选房间，展开时会自动尝试获取'}
                        </SelectItem>
                      )}
                    </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>消息内容</Label>
                  <textarea
                    className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                    placeholder="输入消息内容（1-200字符）"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <Button onClick={handleSendRoomChat} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  发送消息
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                功能开关
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">回放录制</div>
                  <div className="text-sm text-muted-foreground">
                    开启后自动录制新创建房间的游戏过程
                  </div>
                </div>
                <Switch
                  checked={replayEnabled}
                  onCheckedChange={handleToggleReplay}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">房间创建</div>
                  <div className="text-sm text-muted-foreground">
                    关闭后禁止玩家创建新房间
                  </div>
                </div>
                <Switch
                  checked={roomCreationEnabled}
                  onCheckedChange={handleToggleRoomCreation}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'contest' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  比赛房间管理
                </CardTitle>
                <CardDescription>
                  配置比赛模式：白名单限制 + 手动开始 + 结算后自动解散
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p>比赛房间特性：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>仅白名单内用户可进入房间</li>
                        <li>房主发起开始后需管理员手动确认</li>
                        <li>对局结束后自动解散房间</li>
                        <li>结算结果会输出到服务器日志</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  房间配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contestRoomId">房间 ID</Label>
                  <Input
                    id="contestRoomId"
                    placeholder="输入房间 ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">比赛模式</div>
                    <div className="text-sm text-muted-foreground">
                      启用后房间变为比赛模式
                    </div>
                  </div>
                  <Switch
                    checked={contestEnabled}
                    onCheckedChange={setContestEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whitelist" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    白名单用户 ID
                  </Label>
                  <textarea
                    id="whitelist"
                    className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                    placeholder="输入用户 ID，用逗号分隔，例如: 100, 200, 300"
                    value={whitelist}
                    onChange={(e) => setWhitelist(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    留空则默认取当前房间内所有用户为白名单
                  </p>
                </div>

                <Button 
                  onClick={handleConfigContest} 
                  disabled={loading}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? '配置中...' : '应用配置'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  白名单管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>更新白名单</Label>
                  <textarea
                    className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                    placeholder="输入新的用户 ID 列表，用逗号分隔"
                    value={whitelist}
                    onChange={(e) => setWhitelist(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    会自动将当前房间内用户补进白名单
                  </p>
                </div>
                <Button 
                  onClick={handleUpdateWhitelist} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  更新白名单
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  开始比赛
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">强制开始</div>
                    <div className="text-sm text-muted-foreground">
                      忽略未 ready 的玩家直接开始
                    </div>
                  </div>
                  <Switch
                    checked={force}
                    onCheckedChange={setForce}
                  />
                </div>
                <Button 
                  onClick={handleStartContest} 
                  disabled={loading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {loading ? '处理中...' : '开始比赛'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Tabs>
  );
}
