import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 房间状态配置
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface StateBadgeConfig {
  label: string;
  variant: BadgeVariant;
}

const stateBadgeMap: Record<string, StateBadgeConfig> = {
  'select_chart': { label: '选谱', variant: 'secondary' },
  'playing': { label: '游戏中', variant: 'default' },
  'waiting': { label: '等待中', variant: 'outline' },
  'waiting_for_ready': { label: '准备中', variant: 'secondary' },
};

export function getStateBadgeConfig(state: string): StateBadgeConfig {
  return stateBadgeMap[state] || { label: state, variant: 'outline' };
}
