import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Trophy, 
  Users, 
  Play, 
  Settings,
  CheckCircle,
  AlertCircle,
  List
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export function ContestPanel() {
  const [roomId, setRoomId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [whitelist, setWhitelist] = useState('');
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const result = await apiService.configContestRoom(roomId, enabled, userIds);
      if (result.ok) {
        toast.success(`比赛模式已${enabled ? '启用' : '关闭'}`);
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

  return (
    <div className="space-y-4 animate-fade-in">
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
              checked={enabled}
              onCheckedChange={setEnabled}
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
  );
}
