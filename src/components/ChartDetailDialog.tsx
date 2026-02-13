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
import { ExternalLink, Loader2, Music, User, Star, Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { phiraApiService, type ChartInfo } from '@/services/phiraApi';
import { toast } from 'sonner';

interface ChartDetailDialogProps {
  chartId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChartDetailDialog({ chartId, open, onOpenChange }: ChartDetailDialogProps) {
  const [chartInfo, setChartInfo] = useState<ChartInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchChartInfo = useCallback(async () => {
    setLoading(true);
    try {
      const info = await phiraApiService.getChartInfoCached(chartId);
      if (info) {
        setChartInfo(info);
      } else {
        toast.error('获取谱面信息失败');
      }
    } catch {
      toast.error('获取谱面信息失败');
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => {
    if (open && chartId) {
      fetchChartInfo();
    }
  }, [open, chartId, fetchChartInfo]);

  const handleOpenChartPage = () => {
    window.open(`https://phira.5wyxi.com/chart/${chartId}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getStatusBadge = (chart: ChartInfo) => {
    if (!chart.reviewed) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          审核中
        </Badge>
      );
    }
    if (chart.stable) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          上架
        </Badge>
      );
    }
    if (chart.ranked) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Star className="h-3 w-3 mr-1" />
          特殊
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
        <XCircle className="h-3 w-3 mr-1" />
        未上架
      </Badge>
    );
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 15) return 'text-red-500';
    if (difficulty >= 13) return 'text-purple-500';
    if (difficulty >= 10) return 'text-blue-500';
    if (difficulty >= 7) return 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            谱面详情
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartInfo ? (
            <div className="space-y-4">
              {/* 曲绘 */}
              {chartInfo.illustration && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={chartInfo.illustration}
                    alt={chartInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 基本信息 */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{chartInfo.name}</h3>
                  {getStatusBadge(chartInfo)}
                </div>
                <p className="text-sm text-muted-foreground">ID: {chartInfo.id}</p>
              </div>

              <Separator />

              {/* 难度信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    难度
                  </div>
                  <div className="text-lg font-semibold">
                    <span className={getDifficultyColor(chartInfo.difficulty)}>
                      {chartInfo.level}
                    </span>
                  </div>
                  <div className={`text-sm ${getDifficultyColor(chartInfo.difficulty)}`}>
                    定数: {chartInfo.difficulty?.toFixed(1) || '-'}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    评分
                  </div>
                  <div className="text-lg font-semibold">
                    {chartInfo.rating ? `${(chartInfo.rating * 100).toFixed(1)}%` : '暂无'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {chartInfo.ratingCount ? `${chartInfo.ratingCount} 人评分` : ''}
                  </div>
                </div>
              </div>

              {/* 创作者信息 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">谱师:</span>
                  <span className="font-medium">{chartInfo.charter || '未知'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">曲师:</span>
                  <span className="font-medium">{chartInfo.composer || '未知'}</span>
                </div>
                {chartInfo.illustrator && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">画师:</span>
                    <span className="font-medium">{chartInfo.illustrator}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">上传者:</span>
                  <span className="font-medium">ID {chartInfo.uploader}</span>
                </div>
              </div>

              {/* 描述 */}
              {chartInfo.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">简介</div>
                  <div className="text-sm whitespace-pre-wrap">{chartInfo.description}</div>
                </div>
              )}

              {/* 标签 */}
              {chartInfo.tags && chartInfo.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {chartInfo.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 时间信息 */}
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>上传时间: {formatDate(chartInfo.created)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>更新时间: {formatDate(chartInfo.updated)}</span>
                </div>
              </div>

              <Separator />

              {/* 操作按钮 */}
              <Button onClick={handleOpenChartPage} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看谱面页面
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              无法获取谱面信息
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
