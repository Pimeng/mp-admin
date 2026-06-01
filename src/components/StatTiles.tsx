import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatTile {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** 图标与数值的强调色，例如 'text-green-600' */
  accent?: string;
}

interface StatTilesProps {
  tiles: StatTile[];
  className?: string;
}

export function StatTiles({ tiles, className }: StatTilesProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className={cn('rounded-md bg-muted p-2', tile.accent)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className={cn('text-xl font-semibold leading-tight', tile.accent)}>
                {tile.value}
              </div>
              <div className="truncate text-xs text-muted-foreground">{tile.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
