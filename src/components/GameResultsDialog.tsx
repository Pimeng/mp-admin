import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Target, Sparkles } from 'lucide-react';
import { phiraApiService } from '@/services/phiraApi';

interface PlayerResult {
  userId: number;
  userName: string;
  avatar?: string;
  recordId?: number;
  score?: number;
  accuracy?: number;
  perfect?: number;
  good?: number;
  bad?: number;
  miss?: number;
  fullCombo?: boolean;
  maxCombo?: number;
}

interface GameResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerRecordIds: { userId: number; userName: string; recordId?: number }[];
}

export function GameResultsDialog({ open, onOpenChange, playerRecordIds }: GameResultsDialogProps) {
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // 获取所有玩家成绩
  const fetchPlayerResults = useCallback(async () => {
    if (!playerRecordIds.length) return;
    
    setLoading(true);
    const results: PlayerResult[] = [];

    await Promise.all(
      playerRecordIds.map(async (player) => {
        try {
          // 获取用户信息
          const userInfo = await phiraApiService.getUserInfoCached(player.userId);
          
          if (player.recordId) {
            // 获取成绩信息
            const recordInfo = await phiraApiService.getRecordInfoCached(player.recordId);
            
            if (recordInfo) {
              results.push({
                userId: player.userId,
                userName: userInfo?.name || player.userName,
                avatar: userInfo?.avatar,
                recordId: player.recordId,
                score: recordInfo.score,
                accuracy: recordInfo.accuracy,
                perfect: recordInfo.perfect,
                good: recordInfo.good,
                bad: recordInfo.bad,
                miss: recordInfo.miss,
                fullCombo: recordInfo.full_combo,
                maxCombo: recordInfo.max_combo,
              });
            } else {
              results.push({
                userId: player.userId,
                userName: userInfo?.name || player.userName,
                avatar: userInfo?.avatar,
              });
            }
          } else {
            results.push({
              userId: player.userId,
              userName: userInfo?.name || player.userName,
              avatar: userInfo?.avatar,
            });
          }
        } catch {
          results.push({
            userId: player.userId,
            userName: player.userName,
          });
        }
      })
    );

    setPlayerResults(results);
    setLoading(false);
  }, [playerRecordIds]);

  // 计算最高分玩家
  const getHighestScorePlayer = () => {
    const playersWithScore = playerResults.filter(p => p.score !== undefined);
    if (playersWithScore.length === 0) return null;
    return playersWithScore.reduce((max, p) => (p.score! > max.score! ? p : max));
  };

  // 计算最高准度玩家
  const getHighestAccuracyPlayer = () => {
    const playersWithAccuracy = playerResults.filter(p => p.accuracy !== undefined);
    if (playersWithAccuracy.length === 0) return null;
    return playersWithAccuracy.reduce((max, p) => (p.accuracy! > max.accuracy! ? p : max));
  };

  // 计算最高无瑕度玩家（Perfect数最多且没有Bad和Miss）
  const getBestPerfectionPlayer = () => {
    const playersWithJudgements = playerResults.filter(p => p.perfect !== undefined);
    if (playersWithJudgements.length === 0) return null;
    
    // 优先考虑AP（All Perfect），然后看Perfect数量
    const sorted = playersWithJudgements.sort((a, b) => {
      const aIsAP = a.bad === 0 && a.miss === 0 && a.good === 0;
      const bIsAP = b.bad === 0 && b.miss === 0 && b.good === 0;
      
      if (aIsAP && !bIsAP) return -1;
      if (!aIsAP && bIsAP) return 1;
      
      // 如果都是AP或都不是AP，比较Perfect数量
      return b.perfect! - a.perfect!;
    });
    
    return sorted[0];
  };

  // 格式化准度
  const formatAccuracy = (accuracy: number) => {
    return `${(accuracy * 100).toFixed(2)}%`;
  };

  // 获取分数等级
  const getScoreRank = (score: number) => {
    if (score >= 1000000) return { label: 'AP', color: 'bg-yellow-500' };
    if (score >= 995000) return { label: 'V', color: 'bg-purple-500' };
    if (score >= 980000) return { label: 'S', color: 'bg-blue-500' };
    if (score >= 950000) return { label: 'A', color: 'bg-green-500' };
    if (score >= 900000) return { label: 'B', color: 'bg-yellow-600' };
    if (score >= 800000) return { label: 'C', color: 'bg-orange-500' };
    return { label: 'F', color: 'bg-gray-500' };
  };

  // 打开时获取数据
  useEffect(() => {
    if (open) {
      fetchPlayerResults();
      setCountdown(30);
    }
  }, [open, fetchPlayerResults]);

  // 倒计时自动关闭
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onOpenChange(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onOpenChange]);

  const highestScorePlayer = getHighestScorePlayer();
  const highestAccuracyPlayer = getHighestAccuracyPlayer();
  const bestPerfectionPlayer = getBestPerfectionPlayer();

  const ResultCard = ({
    title,
    icon: Icon,
    iconColor,
    player,
    detailLabel,
    detailValue,
    subDetail,
  }: {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    player: PlayerResult | null;
    detailLabel: string;
    detailValue: string;
    subDetail?: string;
  }) => (
    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
      <div className={`flex items-center gap-2 mb-3 ${iconColor}`}>
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{title}</span>
      </div>
      
      {player ? (
        <>
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={player.avatar} alt={player.userName} />
            <AvatarFallback className="text-lg">{player.userName?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-center mb-2">{player.userName}</span>
          <div className="text-center">
            <div className="text-lg font-bold">{detailValue}</div>
            <div className="text-xs text-muted-foreground">{detailLabel}</div>
          </div>
          {subDetail && (
            <div className="text-xs text-muted-foreground mt-1">{subDetail}</div>
          )}
        </>
      ) : (
        <div className="text-muted-foreground text-sm">暂无数据</div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              游戏结束 - 成绩统计
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {countdown}秒后自动关闭
              </span>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 py-4">
            {/* 最高分 */}
            <ResultCard
              title="最高分"
              icon={Trophy}
              iconColor="text-yellow-500"
              player={highestScorePlayer}
              detailLabel="分数"
              detailValue={highestScorePlayer?.score?.toLocaleString() || '-'}
              subDetail={highestScorePlayer?.score ? getScoreRank(highestScorePlayer.score).label : undefined}
            />

            {/* 最高准度 */}
            <ResultCard
              title="最高准度"
              icon={Target}
              iconColor="text-blue-500"
              player={highestAccuracyPlayer}
              detailLabel="准度"
              detailValue={highestAccuracyPlayer?.accuracy !== undefined ? formatAccuracy(highestAccuracyPlayer.accuracy) : '-'}
              subDetail={highestAccuracyPlayer ? `Max Combo: ${highestAccuracyPlayer.maxCombo || 0}` : undefined}
            />

            {/* 最高无瑕度 */}
            <ResultCard
              title="最高无瑕度"
              icon={Sparkles}
              iconColor="text-purple-500"
              player={bestPerfectionPlayer}
              detailLabel="Perfect"
              detailValue={bestPerfectionPlayer?.perfect?.toString() || '-'}
              subDetail={
                bestPerfectionPlayer
                  ? `P:${bestPerfectionPlayer.perfect} G:${bestPerfectionPlayer.good || 0} B:${bestPerfectionPlayer.bad || 0} M:${bestPerfectionPlayer.miss || 0}`
                  : undefined
              }
            />
          </div>
        )}

        {/* 底部提示 */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          点击任意位置或等待倒计时结束关闭弹窗
        </div>
      </DialogContent>
    </Dialog>
  );
}
