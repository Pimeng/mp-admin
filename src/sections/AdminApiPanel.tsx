import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RoomIdCombobox } from '@/components/RoomIdCombobox';

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
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { apiService } from '@/services/api';
import { phiraApiService, type UserDetailInfo, type UserListItem } from '@/services/phiraApi';
import { toast } from 'sonner';
import { getStateBadgeConfig } from '@/lib/utils';
import type { Room } from '@/types/api';

const adminTabs = [
  { value: 'rooms', label: '\u623f\u95f4\u7ba1\u7406' },
  { value: 'users', label: '\u7528\u6237\u7ba1\u7406' },
  { value: 'messages', label: '\u6d88\u606f\u5e7f\u64ad' },
  { value: 'settings', label: '\u529f\u80fd\u5f00\u5173' },
  { value: 'contest', label: '\u6bd4\u8d5b' },
];

const getApiErrorMessage = (response: unknown, fallback = '未知错误') => {
  if (response && typeof response === 'object' && 'error' in response) {
    const { error } = response as { error?: unknown };
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
  }

  return fallback;
};

export function AdminApiPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState<UserDetailInfo | null>(null);
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [replayEnabled, setReplayEnabled] = useState(false);
  const [roomCreationEnabled, setRoomCreationEnabled] = useState(true);
  const [isRoomOptionsLoading, setIsRoomOptionsLoading] = useState(false);

  // 比赛相关状态
  const [contestEnabled, setContestEnabled] = useState(false);
  const [whitelist, setWhitelist] = useState('');
  const [force, setForce] = useState(false);

  // 用户列表缓存（用于白名单自动补全）
  const cacheData = useMemo(() => phiraApiService.loadUserListCache(), []);
  const [userList, setUserList] = useState<UserListItem[]>(cacheData?.users || []);
  const [userListPage, setUserListPage] = useState(cacheData?.page || 1);
  const [isLoadingUserList, setIsLoadingUserList] = useState(false);
  const [configSearch, setConfigSearch] = useState('');
  const [manageSearch, setManageSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userListTotal, setUserListTotal] = useState(cacheData?.count || 0);
  const [unknownUsersInfo, setUnknownUsersInfo] = useState<Map<number, UserListItem>>(new Map());
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);
  const [manualPauseUntil, setManualPauseUntil] = useState(0);
  const userListLoadedRef = useRef(!!cacheData);
  const autoLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomSearchInputRef = useRef<HTMLInputElement>(null);
  const currentTab = location.pathname.split('/').filter(Boolean)[1] || 'rooms';
  const activeTab = adminTabs.some((tab) => tab.value === currentTab) ? currentTab : 'rooms';

  // 自动加载用户列表
  useEffect(() => {
    if (activeTab !== 'contest') {
      // 清理定时器
      if (autoLoadTimerRef.current) {
        clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
      if (manualPauseTimerRef.current) {
        clearTimeout(manualPauseTimerRef.current);
        manualPauseTimerRef.current = null;
      }
      return;
    }

    // 加载下一页的函数
    const loadNextPage = async (nextPage: number) => {
      // 检查是否处于手动暂停期
      if (!autoLoadEnabled || Date.now() < manualPauseUntil) return;
      
      try {
        const data = await phiraApiService.getUserList(20, nextPage);
        setUserListTotal(data.count);
        setUserList(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.results.filter(u => !existingIds.has(u.id));
          const merged = [...prev, ...newUsers];
          // 保存到 localStorage
          phiraApiService.saveUserListCache(merged, data.count, nextPage);
          return merged;
        });
        setUserListPage(nextPage);
        
        // 如果还有更多页，1秒后加载下一页
        const totalPages = Math.ceil(data.count / 20);
        if (nextPage < totalPages && autoLoadEnabled && Date.now() >= manualPauseUntil) {
          autoLoadTimerRef.current = setTimeout(() => {
            void loadNextPage(nextPage + 1);
          }, 1000);
        }
      } catch {
        // 加载失败，停止自动加载
        setAutoLoadEnabled(false);
      }
    };

    // 首次加载（如果没有缓存）
    if (!userListLoadedRef.current) {
      userListLoadedRef.current = true;
      void phiraApiService.getUserList(20, 1).then(data => {
        setUserList(data.results);
        setUserListTotal(data.count);
        setUserListPage(1);
        phiraApiService.saveUserListCache(data.results, data.count, 1);
        
        // 启动自动加载
        const totalPages = Math.ceil(data.count / 20);
        if (totalPages > 1 && autoLoadEnabled) {
          autoLoadTimerRef.current = setTimeout(() => {
            void loadNextPage(2);
          }, 1000);
        }
      }).catch(() => {
        toast.error('加载用户列表失败');
      });
    } else if (autoLoadEnabled && Date.now() >= manualPauseUntil) {
      // 有缓存且自动加载开启，继续加载下一页
      const totalPages = Math.ceil(userListTotal / 20);
      if (userListPage < totalPages) {
        autoLoadTimerRef.current = setTimeout(() => {
          void loadNextPage(userListPage + 1);
        }, 1000);
      }
    }

    return () => {
      if (autoLoadTimerRef.current) {
        clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
      if (manualPauseTimerRef.current) {
        clearTimeout(manualPauseTimerRef.current);
        manualPauseTimerRef.current = null;
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, autoLoadEnabled, manualPauseUntil]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'rooms') return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        roomSearchInputRef.current?.focus();
        roomSearchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

  // 加载用户列表（用于白名单自动补全）
  const loadUserList = async (page: number = 1, append: boolean = false) => {
    setIsLoadingUserList(true);
    try {
      const data = await phiraApiService.getUserList(20, page);
      setUserListTotal(data.count);
      if (append) {
        setUserList(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.results.filter(u => !existingIds.has(u.id));
          const merged = [...prev, ...newUsers];
          phiraApiService.saveUserListCache(merged, data.count, page);
          return merged;
        });
      } else {
        setUserList(data.results);
        phiraApiService.saveUserListCache(data.results, data.count, page);
      }
      setUserListPage(page);
    } catch {
      toast.error('加载用户列表失败');
    } finally {
      setIsLoadingUserList(false);
    }
  };

  // 添加用户到白名单
  const addToWhitelist = (userId: number) => {
    const currentIds = parseWhitelist();
    if (!currentIds.includes(userId)) {
      const newIds = [...currentIds, userId];
      setWhitelist(newIds.join(', '));
    }
  };

  // 从白名单移除用户
  const removeFromWhitelist = (userId: number) => {
    const currentIds = parseWhitelist();
    const newIds = currentIds.filter(id => id !== userId);
    setWhitelist(newIds.join(', '));
  };

  // 获取白名单中的用户信息
  const getWhitelistUsers = (): UserListItem[] => {
    const ids = parseWhitelist();
    return ids
      .map(id => userList.find(u => u.id === id))
      .filter((u): u is UserListItem => u !== undefined);
  };

  // 搜索用户（调用 API），带取消机制
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchUsers = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    // 取消之前的搜索请求
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    searchAbortRef.current = abortController;

    setIsSearching(true);
    setSearchResults([]); // 清空旧结果，避免显示之前搜索的内容
    try {
      const data = await phiraApiService.getUserList(20, 1, keyword, abortController.signal);
      
      // 如果已经被取消了，就不更新结果
      if (abortController.signal.aborted) return;

      setSearchResults(data.results);

      // 将搜索结果缓存到 userList（按ID去重并排序）
      if (data.results.length > 0) {
        setUserList(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.results.filter(u => !existingIds.has(u.id));
          const merged = [...prev, ...newUsers].sort((a, b) => a.id - b.id);
          // 保存到 localStorage
          phiraApiService.saveUserListCache(merged, userListTotal, userListPage);
          return merged;
        });
      }
    } catch {
      if (!abortController.signal.aborted) {
        setSearchResults([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  // 过滤用户列表（用于自动补全）
  const filteredUsers = (searchText: string): UserListItem[] => {
    if (!searchText.trim()) return userList.slice(0, 20);
    const search = searchText.toLowerCase();
    return userList.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.id.toString().includes(search)
    ).slice(0, 20);
  };

  // 加载白名单中未知用户的详细信息
  useEffect(() => {
    const loadUnknownUsers = async () => {
      const ids = parseWhitelist().filter(id => 
        !userList.find(u => u.id === id) && 
        !unknownUsersInfo.has(id)
      );
      if (ids.length === 0) return;

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const info = await phiraApiService.getUserInfo(id);
            return { id: info.id, name: info.name, avatar: info.avatar };
          } catch {
            return null;
          }
        })
      );

      setUnknownUsersInfo(prev => {
        const next = new Map(prev);
        results.forEach(user => {
          if (user) next.set(user.id, user);
        });
        return next;
      });
    };

    void loadUnknownUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whitelist, userList]);

  const fetchAdminRooms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        setRooms(data.rooms || []);
        toast.success(`获取到 ${data.rooms.length} 个房间`);
      } else {
        const errorMsg = getApiErrorMessage(data);
        if (errorMsg === 'unauthorized') {
          toast.error('管理员 TOKEN 无效或已过期，请重新配置');
        } else if (errorMsg === 'admin-disabled') {
          toast.error('服务器未配置管理员 TOKEN，无法使用管理功能');
        } else {
          toast.error('获取房间列表失败: ' + errorMsg);
        }
      }
    } catch {
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
        const errorMsg = getApiErrorMessage(data);
        toast.error('获取房间列表失败: ' + errorMsg);
      }
    } catch {
      toast.error('获取房间列表失败');
    } finally {
      setIsRoomOptionsLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!userId) {
      toast.error('请输入用户 ID');
      return;
    }
    try {
      const data = await phiraApiService.getUserInfo(Number(userId));
      setUserInfo(data);
    } catch {
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
    } catch {
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
    } catch {
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
        const errorMsg = getApiErrorMessage(result);
        toast.error('解散失败: ' + errorMsg);
      }
    } catch {
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
    } catch {
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
    } catch {
      toast.error('请求失败');
    }
  };

  const loadSettings = useCallback(async () => {
    try {
      const [replayResult, roomCreationResult] = await Promise.all([
        apiService.getReplayConfig(),
        apiService.getRoomCreationConfig(),
      ]);
      if (replayResult.ok) {
        setReplayEnabled(replayResult.enabled);
      }
      if (roomCreationResult.ok) {
        setRoomCreationEnabled(roomCreationResult.enabled);
      }
    } catch {
      toast.error('获取功能开关状态失败');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
      void loadSettings();
    }
  }, [activeTab, loadSettings]);

  const handleToggleReplay = async () => {
    try {
      const result = await apiService.setReplayConfig(!replayEnabled);
      if (result.ok) {
        setReplayEnabled(result.enabled);
        toast.success(`回放录制已${result.enabled ? '开启' : '关闭'}`);
      }
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      toast.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const getStateBadge = (type: string) => {
    const config = getStateBadgeConfig(type);
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const normalizedRoomQuery = roomSearchQuery.trim().toLowerCase();
  const filteredRooms = normalizedRoomQuery
    ? rooms
        .map((room, index) => {
          const roomId = room.roomid?.toLowerCase() || '';
          const playerNames = room.users?.map(user => user.name?.toLowerCase() || '') || [];
          const playerIds = room.users?.map(user => String(user.id)) || [];
          const chartName = room.chart?.name?.toLowerCase() || '';
          const chartId = room.chart?.id ? String(room.chart.id).toLowerCase() : '';

          let score = -1;

          if (roomId === normalizedRoomQuery) score = Math.max(score, 400);
          else if (roomId.startsWith(normalizedRoomQuery)) score = Math.max(score, 320);
          else if (roomId.includes(normalizedRoomQuery)) score = Math.max(score, 260);

          if (
            playerNames.some(name => name === normalizedRoomQuery) ||
            playerIds.some(id => id === normalizedRoomQuery)
          ) {
            score = Math.max(score, 180);
          } else if (
            playerNames.some(name => name.includes(normalizedRoomQuery)) ||
            playerIds.some(id => id.includes(normalizedRoomQuery))
          ) {
            score = Math.max(score, 140);
          }

          if (chartName === normalizedRoomQuery || chartId === normalizedRoomQuery) {
            score = Math.max(score, 110);
          } else if (chartName.includes(normalizedRoomQuery) || chartId.includes(normalizedRoomQuery)) {
            score = Math.max(score, 90);
          }

          return { room, index, score };
        })
        .filter(item => item.score >= 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(item => item.room)
    : rooms;

  const visibleUserCount = filteredRooms.reduce((sum, room) => sum + (room.users?.length || 0), 0);

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
                <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    房间列表
                    {rooms.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredRooms.length}/{rooms.length} 个房间
                      </Badge>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-end gap-2 md:w-auto">
                    <div className="relative w-full md:w-[420px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={roomSearchInputRef}
                        value={roomSearchQuery}
                        onChange={(event) => setRoomSearchQuery(event.target.value)}
                        placeholder="搜索房间ID，或玩家名字/ID、谱面名字/ID"
                        className="h-10 pl-9 pr-16"
                      />
                      <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground">
                        <span className="rounded border px-1.5 py-0.5">Ctrl</span>
                        <span className="rounded border px-1.5 py-0.5">K</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={fetchAdminRooms} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      刷新
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>查看所有房间的详细状态</span>
                  {rooms.length > 0 && (
                    <span className="text-muted-foreground">
                      | 当前显示玩家数: {visibleUserCount} 人
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无房间数据，点击刷新获取
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到匹配的房间，可尝试搜索房间ID、玩家名字或谱面信息
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRooms.map((room, index) => (
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
                        {userInfo.banned && <Badge variant="destructive">已封禁</Badge>}
                        {userInfo.login_banned && <Badge variant="destructive">已禁止登录</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>ID: {userInfo.id}</div>
                      <div>RKS: {userInfo.rks}</div>
                      <div>经验: {userInfo.exp}</div>
                      <div>语言: {userInfo.language}</div>
                      <div>加入时间: {new Date(userInfo.joined).toLocaleDateString()}</div>
                      <div>最后登录: {new Date(userInfo.last_login).toLocaleDateString()}</div>
                      <div>粉丝: {userInfo.follower_count} | 关注: {userInfo.following_count}</div>
                      {userInfo.bio && <div>简介: {userInfo.bio}</div>}
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
                  <RoomIdCombobox
                    value={roomId}
                    rooms={rooms}
                    loading={isRoomOptionsLoading}
                    placeholder="输入或选择房间 ID"
                    emptyText="没有匹配的房间，可继续直接输入"
                    onValueChange={setRoomId}
                    onOpen={ensureAdminRoomsLoaded}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRoomOptionsLoading ? '正在加载房间列表...' : '支持直接输入，也可以搜索房主名或房间 ID 后点选'}
                  </p>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whitelist" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      白名单用户
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      已加载 {userList.length} / {userListTotal} 用户
                    </span>
                  </div>
                  
                  {/* 已选用户标签 */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-md bg-muted/50">
                    {getWhitelistUsers().length === 0 && (
                      <span className="text-xs text-muted-foreground py-1">未选择用户（留空则取房间内所有用户）</span>
                    )}
                    {getWhitelistUsers().map(user => (
                      <Badge key={user.id} variant="secondary" className="gap-1 pr-1 items-center">
                        {user.avatar && (
                          <img src={user.avatar} alt="" className="w-4 h-4 rounded-full" />
                        )}
                        {user.name}
                        <span className="text-muted-foreground">#{user.id}</span>
                        <button
                          onClick={() => removeFromWhitelist(user.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {parseWhitelist().filter(id => !userList.find(u => u.id === id)).map(id => {
                      const unknown = unknownUsersInfo.get(id);
                      return (
                        <Badge key={id} variant="outline" className="gap-1 pr-1 items-center">
                          {unknown ? (
                            <>
                              {unknown.avatar && (
                                <img src={unknown.avatar} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              {unknown.name}
                              <span className="text-muted-foreground">#{id}</span>
                            </>
                          ) : (
                            `用户 #${id}`
                          )}
                          <button
                            onClick={() => removeFromWhitelist(id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  
                  {/* 自动补全输入 */}
                  <Command shouldFilter={false} className="border rounded-md overflow-visible">
                    <CommandInput
                      placeholder="搜索用户ID或用户名添加..."
                      value={configSearch}
                      onValueChange={(value) => {
                        setConfigSearch(value);
                        void searchUsers(value);
                      }}
                    />
                    {configSearch && (
                      <CommandList className="border-t">
                        <CommandEmpty>{isSearching ? '搜索中...' : '未找到匹配的用户'}</CommandEmpty>
                        <CommandGroup>
                          {(searchResults.length > 0 ? searchResults : filteredUsers(configSearch)).map(user => (
                            <CommandItem
                              key={user.id}
                              value={`${user.id}-${user.name}`}
                              onSelect={() => {
                                addToWhitelist(user.id);
                                setConfigSearch('');
                                setSearchResults([]);
                              }}
                              disabled={parseWhitelist().includes(user.id)}
                              className="gap-2"
                            >
                              {user.avatar && (
                                <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                              )}
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground">#{user.id}</span>
                              {parseWhitelist().includes(user.id) && (
                                <span className="ml-auto text-xs text-muted-foreground">已添加</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    )}
                  </Command>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // 手动加载时暂停自动加载3秒
                          const resumeTime = Date.now() + 3000;
                          setManualPauseUntil(resumeTime);
                          if (manualPauseTimerRef.current) {
                            clearTimeout(manualPauseTimerRef.current);
                          }
                          manualPauseTimerRef.current = setTimeout(() => {
                            setManualPauseUntil(0);
                          }, 3000);
                          void loadUserList(userListPage + 1, true);
                        }}
                        disabled={isLoadingUserList}
                        className="text-xs"
                      >
                        {isLoadingUserList && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        加载更多
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAutoLoadEnabled(!autoLoadEnabled);
                          if (!autoLoadEnabled) {
                            // 重新启动自动加载
                            const totalPages = Math.ceil(userListTotal / 20);
                            if (userListPage < totalPages) {
                              void loadUserList(userListPage + 1, true);
                            }
                          }
                        }}
                        className="text-xs"
                      >
                        {autoLoadEnabled ? '暂停自动加载' : '继续自动加载'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          phiraApiService.clearUserListCache();
                          setUserList([]);
                          setUserListPage(1);
                          setUserListTotal(0);
                          userListLoadedRef.current = false;
                          toast.success('用户列表缓存已清除');
                        }}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        清除缓存
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      页 {userListPage} / {Math.ceil(userListTotal / 20) || '?'}
                    </span>
                  </div>
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
                  <Label>当前白名单</Label>
                  
                  {/* 已选用户标签 */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-md bg-muted/50">
                    {getWhitelistUsers().length === 0 && (
                      <span className="text-xs text-muted-foreground py-1">未选择用户</span>
                    )}
                    {getWhitelistUsers().map(user => (
                      <Badge key={user.id} variant="secondary" className="gap-1 pr-1 items-center">
                        {user.avatar && (
                          <img src={user.avatar} alt="" className="w-4 h-4 rounded-full" />
                        )}
                        {user.name}
                        <span className="text-muted-foreground">#{user.id}</span>
                        <button
                          onClick={() => removeFromWhitelist(user.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {parseWhitelist().filter(id => !userList.find(u => u.id === id)).map(id => {
                      const unknown = unknownUsersInfo.get(id);
                      return (
                        <Badge key={id} variant="outline" className="gap-1 pr-1 items-center">
                          {unknown ? (
                            <>
                              {unknown.avatar && (
                                <img src={unknown.avatar} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              {unknown.name}
                              <span className="text-muted-foreground">#{id}</span>
                            </>
                          ) : (
                            `用户 #${id}`
                          )}
                          <button
                            onClick={() => removeFromWhitelist(id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  
                  {/* 自动补全输入 */}
                  <Command shouldFilter={false} className="border rounded-md overflow-visible">
                    <CommandInput
                      placeholder="搜索用户ID或用户名添加..."
                      value={manageSearch}
                      onValueChange={(value) => {
                        setManageSearch(value);
                        void searchUsers(value);
                      }}
                    />
                    {manageSearch && (
                      <CommandList className="border-t">
                        <CommandEmpty>{isSearching ? '搜索中...' : '未找到匹配的用户'}</CommandEmpty>
                        <CommandGroup>
                          {(searchResults.length > 0 ? searchResults : filteredUsers(manageSearch)).map(user => (
                            <CommandItem
                              key={user.id}
                              value={`${user.id}-${user.name}`}
                              onSelect={() => {
                                addToWhitelist(user.id);
                                setManageSearch('');
                                setSearchResults([]);
                              }}
                              disabled={parseWhitelist().includes(user.id)}
                              className="gap-2"
                            >
                              {user.avatar && (
                                <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                              )}
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground">#{user.id}</span>
                              {parseWhitelist().includes(user.id) && (
                                <span className="ml-auto text-xs text-muted-foreground">已添加</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    )}
                  </Command>
                  
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
