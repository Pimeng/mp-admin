import { Badge } from '@/components/ui/badge';
import { getStateBadgeConfig } from '@/lib/ui-helpers';

interface StateBadgeProps {
  state: string;
  className?: string;
}

export function StateBadge({ state, className }: StateBadgeProps) {
  const config = getStateBadgeConfig(state);
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
