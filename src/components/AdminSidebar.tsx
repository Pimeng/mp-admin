import { adminNavItems } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onSelect: (value: string) => void;
}

export function AdminSidebar({ activeTab, onSelect }: AdminSidebarProps) {
  return (
    <nav aria-label="管理员导航" className="lg:w-56 lg:shrink-0">
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 lg:sticky lg:top-24 lg:flex-col lg:gap-0.5 lg:p-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex flex-1 items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors lg:flex-none',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span>{item.label}</span>
                <span className="hidden text-xs font-normal text-muted-foreground lg:block">
                  {item.description}
                </span>
              </span>
              {isActive && (
                <span className="absolute inset-y-1 left-0 hidden w-0.5 rounded-full bg-primary lg:block" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
