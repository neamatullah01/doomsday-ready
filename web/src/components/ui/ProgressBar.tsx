import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // e.g. watchedCount
  max: number; // e.g. totalCount
  label?: string;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  className,
  showPercentage = true,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs font-medium text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            percentage === 100 ? 'bg-emerald-500' : 'bg-red-600',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
