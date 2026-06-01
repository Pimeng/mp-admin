import { LayoutGrid, Megaphone, SlidersHorizontal, Trophy, Users, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const adminNavItems: AdminNavItem[] = [
  { value: 'rooms', label: '房间管理', description: '查看与解散房间', icon: LayoutGrid },
  { value: 'users', label: '用户管理', description: '查询、封禁、踢出', icon: Users },
  { value: 'messages', label: '消息广播', description: '全服 / 房间消息', icon: Megaphone },
  { value: 'settings', label: '功能开关', description: '回放、房间创建', icon: SlidersHorizontal },
  { value: 'contest', label: '比赛', description: '白名单与赛事', icon: Trophy },
];
