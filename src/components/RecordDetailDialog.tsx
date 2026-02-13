import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trophy, Target, Zap, Clock, Calendar, Music, User, Star, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { phiraApiService, type RecordInfo, type ChartInfo, type UserDetailInfo } from '@/services/phiraApi';
import { toast } from 'sonner';

interface RecordDetailDialogProps {
  recordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordDetailDialog({ recordId, open, onOpenChange }: RecordDetailDialogProps) {
  const [recordInfo, setRecordInfo] = useState<RecordInfo | null>(null);
  const [chartInfo, setChartInfo] = useState<ChartInfo | null>(null);
  const [playerInfo, setPlayerInfo] = useState<UserDetailInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecordData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取成绩信息
      const record = await phiraApiService.getRecordInfoCached(recordId);
      if (!record) {
        toast.error('获取成绩信息失败');
        return;
      }
      setRecordInfo(record);

      // 并行获取谱面和玩家信息
      const [chart, player] = await Promise.all([
        phiraApiService.getChartInfoCached(record.chart),
        phiraApiService.getUserInfoCached(record.player),
      ]);

      setChartInfo(chart);
      setPlayerInfo(player);
    } catch {
      toast.error('获取成绩信息失败');
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    if (open && recordId) {
      fetchRecordData();
    }
  }, [open, recordId, fetchRecordData]);

  const handleOpenChartPage = () => {
    if (recordInfo?.chart) {
      window.open(`https://phira.moe/chart/${recordInfo.chart}`, '_blank');
    }
  };

  const handleOpenPlayerProfile = () => {
    if (recordInfo?.player) {
      window.open(`https://phira.moe/user/${recordInfo.player}`, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const formatAccuracy = (accuracy: number) => {
    return `${(accuracy * 100).toFixed(2)}%`;
  };

  const getScoreRank = (score: number) => {
    if (score >= 1000000) return { label: 'AP', color: 'text-yellow-500' };
    if (score >= 995000) return { label: 'V', color: 'text-purple-500' };
    if (score >= 980000) return { label: 'S', color: 'text-blue-500' };
    if (score >= 950000) return { label: 'A', color: 'text-green-500' };
    if (score >= 900000) return { label: 'B', color: 'text-yellow-600' };
    if (score >= 800000) return { label: 'C', color: 'text-orange-500' };
    return { label: 'F', color: 'text-gray-500' };
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 15) return 'text-red-500';
    if (difficulty >= 13) return 'text-purple-500';
    if (difficulty >= 10) return 'text-blue-500';
    if (difficulty >= 7) return 'text-green-500';
    return 'text-gray-500';
  };

  const rank = recordInfo ? getScoreRank(recordInfo.score) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            成绩详情
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recordInfo ? (
            <div className="space-y-4">
              {/* 曲绘 */}
              {chartInfo?.illustration && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={chartInfo.illustration}
                    alt={chartInfo.name}
                    className="w-full h-full object-cover"
                  />
                  {/* 成绩标识 */}
                  <div className="absolute top-2 right-2">
                    <Badge className="text-lg px-3 py-1 bg-black/70 text-white border-0">
                      <span className={rank?.color}>{rank?.label}</span>
                    </Badge>
                  </div>
                  {recordInfo.full_combo && (
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-green-500/80 text-white border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        FC
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* 谱面信息 */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{chartInfo?.name || '未知谱面'}</h3>
                </div>
                {chartInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-semibold ${getDifficultyColor(chartInfo.difficulty)}`}>
                      {chartInfo.level}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">谱师: {chartInfo.charter}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* 分数 */}
              <div className="text-center py-4">
                <div className="text-4xl font-bold tracking-wider">
                  {recordInfo.score.toLocaleString()}
                </div>
                <div className={`text-xl font-semibold mt-1 ${rank?.color}`}>
                  {rank?.label}
                </div>
              </div>

              {/* 判定详情 */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <CheckCircle className="h-3 w-3" />
                    Perfect
                  </div>
                  <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                    {recordInfo.perfect}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <MinusCircle className="h-3 w-3" />
                    Good
                  </div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {recordInfo.good}
                  </div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <XCircle className="h-3 w-3" />
                    Bad
                  </div>
                  <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {recordInfo.bad}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <XCircle className="h-3 w-3" />
                    Miss
                  </div>
                  <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    {recordInfo.miss}
                  </div>
                </div>
              </div>

              {/* 其他统计 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    准度
                  </div>
                  <div className="text-lg font-semibold">
                    {formatAccuracy(recordInfo.accuracy)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    最大连击
                  </div>
                  <div className="text-lg font-semibold">
                    {recordInfo.max_combo}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    流速
                  </div>
                  <div className="text-lg font-semibold">
                    {recordInfo.speed}x
                  </div>
                </div>
              </div>

              {/* STD 信息 */}
              {recordInfo.std !== null && recordInfo.std !== undefined && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <Star className="h-4 w-4" />
                    <span>STD: {recordInfo.std.toFixed(6)}</span>
                  </div>
                  {recordInfo.std_score !== null && recordInfo.std_score !== undefined && (
                    <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      STD Score: {recordInfo.std_score.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* 玩家信息 */}
              {playerInfo && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">玩家:</span>
                    <span className="font-medium">{playerInfo.name}</span>
                    <span className="text-muted-foreground">(ID: {recordInfo.player})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">RKS:</span>
                    <span className="font-medium">{playerInfo.rks?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>达成时间: {formatDate(recordInfo.time)}</span>
              </div>

              {/* 其他信息 */}
              <div className="flex gap-2 flex-wrap">
                {recordInfo.best && (
                  <Badge variant="secondary">Best</Badge>
                )}
                {recordInfo.best_std && (
                  <Badge variant="secondary">Best STD</Badge>
                )}
                {recordInfo.mods > 0 && (
                  <Badge variant="outline">Mods: {recordInfo.mods}</Badge>
                )}
              </div>

              <Separator />

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleOpenPlayerProfile} className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  玩家主页
                </Button>
                <Button onClick={handleOpenChartPage} className="w-full">
                  <Music className="h-4 w-4 mr-2" />
                  谱面页面
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              无法获取成绩信息
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
