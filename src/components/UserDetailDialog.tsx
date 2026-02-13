import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ExternalLink, 
  Loader2, 
  UserX, 
  Shield, 
  Star, 
  Calendar, 
  Users, 
  Ban,
  PowerOff,
  ArrowRightLeft,
  Home
} from 'lucide-react';
import { phiraApiService, type UserDetailInfo } from '@/services/phiraApi';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { UserInfo } from '@/types/api';

interface UserDetailDialogProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
  const [userInfo, setUserInfo] = useState<UserDetailInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRoomInfo, setUserRoomInfo] = useState<UserInfo | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const info = await phiraApiService.getUserInfoCached(userId);
      if (info) {
        setUserInfo(info);
      } else {
        toast.error('获取用户信息失败');
      }
    } catch {
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserRoom = useCallback(async () => {
    setLoadingRoom(true);
    try {
      const data = await apiService.getUserInfo(userId);
      if (data.ok && data.user) {
        setUserRoomInfo(data.user);
      }
    } catch {
      // 静默失败
    } finally {
      setLoadingRoom(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchUserInfo();
      fetchUserRoom();
    }
  }, [open, userId, fetchUserInfo, fetchUserRoom]);

  const handleOpenProfile = () => {
    window.open(`https://phira.moe/user/${userId}`, '_blank');
  };

  const handleBanUser = async () => {
    if (!confirm(`确定要${userInfo?.banned ? '解封' : '封禁'}用户 ${userInfo?.name} 吗？`)) return;
    
    setBanLoading(true);
    try {
      const result = await apiService.banUser(userId, !userInfo?.banned, true);
      if (result.ok) {
        toast.success(`用户已${userInfo?.banned ? '解封' : '封禁'}`);
        // 刷新用户信息
        fetchUserInfo();
        fetchUserRoom();
      } else {
        toast.error('操作失败');
      }
    } catch {
      toast.error('请求失败');
    } finally {
      setBanLoading(false);
    }
  };

  const handleDisconnectUser = async () => {
    if (!confirm(`确定要断开用户 ${userInfo?.name} 的连接吗？`)) return;
    
    setDisconnectLoading(true);
    try {
      const result = await apiService.disconnectUser(userId);
      if (result.ok) {
        toast.success('用户已断开连接');
        // 刷新用户房间信息
        fetchUserRoom();
      } else {
        toast.error('操作失败');
      }
    } catch {
      toast.error('请求失败');
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleGoToRoom = () => {
    if (userRoomInfo?.room) {
      window.open(`/room/${userRoomInfo.room}`, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getRoleBadge = (roles: number) => {
    if (roles & 1) return <Badge className="bg-red-500">管理员</Badge>;
    if (roles & 2) return <Badge className="bg-blue-500">审核员</Badge>;
    return null;
  };

  const isOnline = userRoomInfo?.connected;
  const isBanned = userInfo?.banned || userRoomInfo?.banned;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户详情
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userInfo ? (
            <div className="space-y-4">
              {/* 用户基本信息 */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                  <AvatarFallback>{userInfo.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{userInfo.name}</h3>
                    {getRoleBadge(userInfo.roles)}
                    {isBanned && (
                      <Badge variant="destructive">
                        <UserX className="h-3 w-3 mr-1" />
                        已封禁
                      </Badge>
                    )}
                    {isOnline && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        在线
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">ID: {userInfo.id}</p>
                  {userInfo.badges && userInfo.badges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {userInfo.badges.map((badge) => (
                        <Badge key={badge} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 用户所在房间信息 */}
              {loadingRoom ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : userRoomInfo ? (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">所在房间:</span>
                    {userRoomInfo.room ? (
                      <span className="font-medium">{userRoomInfo.room}</span>
                    ) : (
                      <span className="text-muted-foreground">未在房间中</span>
                    )}
                  </div>
                  {userRoomInfo.room && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleGoToRoom}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      前往房间
                    </Button>
                  )}
                </div>
              ) : null}

              {/* RKS 和统计 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    RKS
                  </div>
                  <div className="text-lg font-semibold">{userInfo.rks?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">粉丝</div>
                  <div className="text-lg font-semibold">{userInfo.follower_count || 0}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">关注</div>
                  <div className="text-lg font-semibold">{userInfo.following_count || 0}</div>
                </div>
              </div>

              {/* 其他信息 */}
              <div className="space-y-2 text-sm">
                {userInfo.bio && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground mb-1">简介</div>
                    <div className="whitespace-pre-wrap">{userInfo.bio}</div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>加入时间: {formatDate(userInfo.joined)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>最后登录: {formatDate(userInfo.last_login)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">语言: {userInfo.language || '未知'}</span>
                </div>
              </div>

              <Separator />

              {/* 管理员操作 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">管理员操作</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={isBanned ? "outline" : "destructive"}
                    size="sm"
                    onClick={handleBanUser}
                    disabled={banLoading}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {banLoading ? '处理中...' : (isBanned ? '解封用户' : '封禁用户')}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectUser}
                    disabled={disconnectLoading || !isOnline}
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    {disconnectLoading ? '处理中...' : '断开连接'}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 操作按钮 */}
              <Button onClick={handleOpenProfile} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                访问主页
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              无法获取用户信息
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
