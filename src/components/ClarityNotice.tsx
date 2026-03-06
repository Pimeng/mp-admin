import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'clarity-notice-closed';

export function ClarityNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查用户是否已经关闭过提示
    const isClosed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isClosed) {
      // 延迟显示，避免页面加载时立即弹出
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50 animate-slide-in hdr-scan">
      <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4 flex items-start gap-3">
        <Eye className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
          <p>
            我们使用 Clarity 分析网站使用情况。如需阻止，请启用浏览器的跟踪防护。
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 -mr-1 -mt-1"
          onClick={handleClose}
        >
          <X className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
        </Button>
      </div>
    </div>
  );
}
