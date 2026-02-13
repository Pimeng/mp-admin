import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Ban, 
  MessageSquare, 
  RefreshCw,
  Search,
  Send,
  Trash2,
  Settings,
  Volume2,
  UserX
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { Room, UserInfo } from '@/types/api';

export function AdminApiPanel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [roomId, setRoomId] = useState('');
  const [maxUsers, setMaxUsers] = useState(8);
  const [message, setMessage] = useState('');
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [roomCreationEnabled, setRoomCreationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');

  const fetchAdminRooms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        setRooms(data.rooms || []);
        toast.success(`获取到 ${data.rooms.length} 个房间`);
      } else {
        toast.error('获取房间列表失败');
      }
    } catch (error) {
      toast.error('请求失败，请检查 TOKEN 是否有效');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSetMaxUsers = async () => {
    if (!roomId) {
      toast.error('请输入房间 ID');
      return;
    }
    try {
      const result = await apiService.setRoomMaxUsers(roomId, maxUsers);
      if (result.ok) {
        toast.success(`房间 ${roomId} 最大人数已设置为 ${maxUsers}`);
      } else {
        toast.error('设置失败');
      }
    } catch (error) {
      toast.error('请求失败');
    }
  };

  const handleDisbandRoom = async () => {
    if (!roomId) {
      toast.error('请输入房间 ID');
      return;
    }
    try {
      const result = await apiService.disbandRoom(roomId);
      if (result.ok) {
        toast.success(`房间 ${roomId} 已解散`);
      } else {
        toast.error('解散失败');
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

  const getStateBadge = (type: string) => {
    const stateMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'select_chart': { label: '选谱', variant: 'secondary' },
      'playing': { label: '游戏中', variant: 'default' },
      'waiting': { label: '等待中', variant: 'outline' },
    };
    const config = stateMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="rooms">房间管理</TabsTrigger>
        <TabsTrigger value="users">用户管理</TabsTrigger>
        <TabsTrigger value="messages">消息广播</TabsTrigger>
        <TabsTrigger value="settings">功能开关</TabsTrigger>
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
                  </div>
                  <Button size="sm" onClick={fetchAdminRooms} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                  </Button>
                </CardTitle>
                <CardDescription>查看所有房间的详细状态</CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无房间数据，点击刷新获取
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {rooms.map((room, index) => (
                        <div
                          key={room.roomid}
                          className="p-3 border rounded-lg transition-all duration-200 hover:border-primary/50 hover:shadow-sm"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{room.roomid}</span>
                            <div className="flex gap-1">
                              {getStateBadge(room.state.type)}
                              {room.locked && <Badge variant="destructive">锁定</Badge>}
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
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  房间操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>房间 ID</Label>
                  <Input
                    placeholder="输入房间 ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大人数 (1-64)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={64}
                      value={maxUsers}
                      onChange={(e) => setMaxUsers(Number(e.target.value))}
                    />
                    <Button onClick={handleSetMaxUsers}>
                      设置
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleDisbandRoom} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  解散房间
                </Button>
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
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
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
      </div>
    </Tabs>
  );
}
