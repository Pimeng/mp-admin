import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, LogIn, Loader2 } from 'lucide-react';
import { phiraApiService } from '@/services/phiraApi';
import { toast } from 'sonner';

interface LoginDialogProps {
  onLoginSuccess?: () => void;
  children?: React.ReactNode;
}

export function LoginDialog({ onLoginSuccess, children }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const data = await phiraApiService.login(email, password);
      toast.success(`登录成功！欢迎，用户 ${data.id}`);
      setOpen(false);
      onLoginSuccess?.();
    } catch (error: any) {
      toast.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <LogIn className="h-4 w-4 mr-2" />
            登录
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Phira 账号登录
          </DialogTitle>
          <DialogDescription>
            登录后可获取用户 TOKEN 用于回放认证
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              密码
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                登录
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
