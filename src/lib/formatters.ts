// 日期格式化工具
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function formatTime(dateStr: string | number): string {
  const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr);
  return date.toLocaleTimeString('zh-CN');
}

export function formatDateTime(dateStr: string | number): string {
  const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 数值格式化
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toFixed(decimals);
}

export function formatRks(rks: number): string {
  return rks?.toFixed(2) ?? '-';
}

export function formatDifficulty(difficulty: number): string {
  return difficulty?.toFixed(1) ?? '-';
}

// 时长格式化（毫秒转可读格式）
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}
