import React from 'react';
import type { RewatchOrderResponse } from '../types/rewatch.types';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { formatRuntime } from '../../../lib/format-runtime';
import { CheckCircle2, Clock, Film } from 'lucide-react';

export interface WatchProgressProps {
  plan: RewatchOrderResponse;
}

export const WatchProgress: React.FC<WatchProgressProps> = ({ plan }) => {
  return (
    <div className="space-y-4">
      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Watched Progress
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {plan.watchedCount}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {plan.totalCount}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Prerequisite movies watched</p>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Remaining Unwatched
            </span>
            <Film className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">
            {plan.unwatchedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Prerequisites still to watch</p>
        </Card>

        <Card className="p-5 border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Remaining Runtime
            </span>
            <Clock className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2 font-mono">
            {formatRuntime(plan.remainingRuntimeMinutes)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {plan.remainingRuntimeMinutes} minutes total
          </p>
        </Card>
      </div>

      {/* Visual Progress Bar Card */}
      <Card className="p-5 border-slate-800 bg-slate-900/60">
        <ProgressBar
          value={plan.watchedCount}
          max={plan.totalCount}
          label={`${plan.watchedCount} of ${plan.totalCount} prerequisites watched`}
        />
      </Card>
    </div>
  );
};
