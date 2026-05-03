import {
  MessageSquare,
  Megaphone,
  Trophy,
  Info,
  type LucideIcon,
} from 'lucide-react';

// 房间日志的四类消息(对齐 api.md / websocket.md 中 recent_logs / room_log 描述)
export type LogType = 'chat' | 'admin' | 'result' | 'system';

export interface LogClassification {
  type: LogType;
  label: string;
  icon: LucideIcon;
  speaker?: string;
  body: string;
  containerClass: string;
  iconClass: string;
  speakerClass: string;
}

const ADMIN_HINT = /(?:管理员通知|^广播[::]|^服务器[::])/;
const RESULT_HINT = /(?:游戏结算|结算结果|本局成绩|总分[::])/;
const CHAT_PATTERN = /^([^\s:：][^:：]{0,31}):\s+([\s\S]+)$/;

// 玩家名后接英文冒号和空格视为聊天;再用关键字识别管理员公屏与结算摘要,其他归为系统事件
export function classifyLog(message: string): LogClassification {
  if (ADMIN_HINT.test(message)) {
    return {
      type: 'admin',
      label: '公告',
      icon: Megaphone,
      body: message,
      containerClass:
        'bg-amber-50/60 dark:bg-amber-950/40 border-l-2 border-l-amber-500',
      iconClass: 'text-amber-600 dark:text-amber-400',
      speakerClass: 'text-amber-700 dark:text-amber-300',
    };
  }

  const chatMatch = CHAT_PATTERN.exec(message);
  if (chatMatch) {
    return {
      type: 'chat',
      label: '聊天',
      icon: MessageSquare,
      speaker: chatMatch[1],
      body: chatMatch[2],
      containerClass:
        'bg-muted/60 border-l-2 border-l-zinc-400 dark:border-l-zinc-500',
      iconClass: 'text-zinc-500 dark:text-zinc-400',
      speakerClass: 'text-foreground',
    };
  }

  if (RESULT_HINT.test(message)) {
    return {
      type: 'result',
      label: '结算',
      icon: Trophy,
      body: message,
      containerClass:
        'bg-violet-50/60 dark:bg-violet-950/40 border-l-2 border-l-violet-500',
      iconClass: 'text-violet-600 dark:text-violet-400',
      speakerClass: 'text-violet-700 dark:text-violet-300',
    };
  }

  return {
    type: 'system',
    label: '系统',
    icon: Info,
    body: message,
    containerClass:
      'bg-blue-50/60 dark:bg-blue-950/40 border-l-2 border-l-blue-500',
    iconClass: 'text-blue-600 dark:text-blue-400',
    speakerClass: 'text-blue-700 dark:text-blue-300',
  };
}
