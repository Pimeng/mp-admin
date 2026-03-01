import type { BadgeVariant } from './utils';

// 难度颜色映射
export function getDifficultyColor(difficulty: number): string {
  if (difficulty >= 15) return 'text-red-500';
  if (difficulty >= 13) return 'text-purple-500';
  if (difficulty >= 10) return 'text-blue-500';
  if (difficulty >= 7) return 'text-green-500';
  return 'text-gray-500';
}

// 难度背景色映射
export function getDifficultyBgColor(difficulty: number): string {
  if (difficulty >= 15) return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (difficulty >= 13) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  if (difficulty >= 10) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  if (difficulty >= 7) return 'bg-green-500/10 text-green-600 border-green-500/20';
  return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
}

// 房间状态配置
export interface StateBadgeConfig {
  label: string;
  variant: BadgeVariant;
}

const stateBadgeMap: Record<string, StateBadgeConfig> = {
  'select_chart': { label: '选谱中', variant: 'secondary' },
  'playing': { label: '游戏中', variant: 'default' },
  'waiting': { label: '等待中', variant: 'outline' },
  'waiting_for_ready': { label: '准备中', variant: 'secondary' },
};

export function getStateBadgeConfig(state: string): StateBadgeConfig {
  return stateBadgeMap[state] || { label: state, variant: 'outline' };
}

// 在线状态配置
export function getConnectionStatusConfig(connected: boolean) {
  return connected
    ? { label: '在线', color: 'text-green-500', bgColor: 'bg-green-500/10' }
    : { label: '离线', color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
}

// WebSocket 状态配置
export function getWebSocketStatusConfig(wsSubscribed: boolean, wsConnected: boolean) {
  if (wsSubscribed) {
    return {
      label: '实时',
      icon: 'wifi',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    };
  }
  if (wsConnected) {
    return {
      label: '未授权',
      icon: 'wifi-off',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
  }
  return {
    label: '离线',
    icon: 'wifi-off',
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };
}

// 游戏状态文本
export function getGameStateText(state: string): string {
  const stateMap: Record<string, string> = {
    'select_chart': '选谱中',
    'playing': '游戏中',
    'waiting': '等待中',
    'waiting_for_ready': '准备中',
  };
  return stateMap[state] || state;
}

// 成绩评级
export function getScoreRank(score: number): { rank: string; color: string } {
  if (score >= 1000000) return { rank: 'φ', color: 'text-yellow-500' };
  if (score >= 960000) return { rank: 'V', color: 'text-purple-500' };
  if (score >= 920000) return { rank: 'S', color: 'text-blue-500' };
  if (score >= 880000) return { rank: 'A', color: 'text-green-500' };
  if (score >= 820000) return { rank: 'B', color: 'text-yellow-600' };
  if (score >= 700000) return { rank: 'C', color: 'text-orange-500' };
  return { rank: 'F', color: 'text-red-500' };
}

// 准确度评级
export function getAccuracyRank(accuracy: number): { rank: string; color: string } {
  if (accuracy >= 100) return { rank: 'ALL PERFECT', color: 'text-yellow-500' };
  if (accuracy >= 99) return { rank: 'S', color: 'text-purple-500' };
  if (accuracy >= 95) return { rank: 'A', color: 'text-blue-500' };
  if (accuracy >= 90) return { rank: 'B', color: 'text-green-500' };
  if (accuracy >= 80) return { rank: 'C', color: 'text-yellow-600' };
  return { rank: 'D', color: 'text-red-500' };
}
