import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'mp_admin_last_route';

export function useRouteRestore() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // 保存当前路由到 localStorage
  useEffect(() => {
    if (!isInitialMount.current) {
      const routeData = {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        timestamp: Date.now(),
      };
      localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routeData));
    }
  }, [location.pathname, location.search, location.hash]);

  // 页面加载时恢复路由
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // 检查当前是否已经在根路径以外的页面
      if (location.pathname !== '/') {
        return;
      }

      const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
      if (savedRoute) {
        try {
          const routeData = JSON.parse(savedRoute);
          const { pathname, search, hash } = routeData;

          // 验证保存的路由是否有效（24小时内）
          const isValid = routeData.timestamp && (Date.now() - routeData.timestamp) < 24 * 60 * 60 * 1000;

          if (isValid && pathname && pathname !== '/') {
            // 恢复之前的路由
            const fullPath = pathname + (search || '') + (hash || '');
            navigate(fullPath, { replace: true });
          }
        } catch {
          // 解析失败，清除存储
          localStorage.removeItem(ROUTE_STORAGE_KEY);
        }
      }
    }
  }, [location.pathname, navigate]);

  // 清除保存的路由（可选，用于登出等场景）
  const clearSavedRoute = () => {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
  };

  return { clearSavedRoute };
}
