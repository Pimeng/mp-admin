import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Copy, Check } from 'lucide-react';
import { phiraApiService } from '@/services/phiraApi';
import { LoginDialog } from './LoginDialog';
import { toast } from 'sonner';

interface UserMenuProps {
  onLoginSuccess?: () => void;
}

export function UserMenu({ onLoginSuccess }: UserMenuProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const token = phiraApiService.getUserToken();
    const id = phiraApiService.getUserId();
    setIsLoggedIn(!!token);
    setUserId(id);
  };

  const handleLoginSuccess = () => {
    checkLoginStatus();
    onLoginSuccess?.();
  };

  const handleLogout = () => {
    phiraApiService.clearAuth();
    checkLoginStatus();
    toast.success('已退出登录');
  };

  const copyToken = async () => {
    const token = phiraApiService.getUserToken();
    if (token) {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('TOKEN 已复制');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginDialog onLoginSuccess={handleLoginSuccess}>
        <Button variant="outline" size="sm">
          <User className="h-4 w-4 mr-2" />
          登录
        </Button>
      </LoginDialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {userId.toString().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">用户 {userId}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>账号信息</DropdownMenuLabel>
        <DropdownMenuItem className="flex justify-between">
          <span className="text-muted-foreground">ID:</span>
          <span>{userId}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToken} className="cursor-pointer">
          <span className="flex-1">复制 TOKEN</span>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
