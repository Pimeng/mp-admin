import { getDifficultyColor } from '@/lib/ui-helpers';

interface DifficultyBadgeProps {
  difficulty: number;
  level?: string;
  showDecimals?: boolean;
  className?: string;
}

export function DifficultyBadge({ 
  difficulty, 
  level, 
  showDecimals = true,
  className = '' 
}: DifficultyBadgeProps) {
  const colorClass = getDifficultyColor(difficulty);
  const formattedDifficulty = showDecimals ? difficulty.toFixed(1) : Math.round(difficulty);
  
  return (
    <span className={`font-semibold ${colorClass} ${className}`}>
      {level ? `${level} (${formattedDifficulty})` : formattedDifficulty}
    </span>
  );
}
