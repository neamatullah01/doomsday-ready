import React from 'react';
import { AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiClientError, ErrorCodes } from '../../types/api.types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface ErrorMessageProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry, className }) => {
  let message = 'An unexpected error occurred. Please try again.';
  let code: string | undefined;

  if (error instanceof ApiClientError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  const isCircularDependency = code === ErrorCodes.CIRCULAR_DEPENDENCY;
  const isNetworkError =
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('networkerror') ||
    message.toLowerCase().includes('connection refused') ||
    message.toLowerCase().includes('load failed');

  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border p-4 my-3 text-sm transition-all',
        isCircularDependency
          ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
          : 'border-rose-500/40 bg-rose-950/30 text-rose-200',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {isCircularDependency ? (
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-100">
              {isCircularDependency ? 'Circular Dependency Detected' : 'Error'}
            </h4>
            {code && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {isNetworkError
              ? 'Cannot connect to backend API server at ' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '. Please ensure the NestJS API server is started.'
              : message}
          </p>
          {isCircularDependency && (
            <p className="text-xs text-amber-300/90 pt-1">
              Tip: A movie cannot depend on itself directly or through a chain of other movies. Check the prerequisite relationships and remove loops.
            </p>
          )}
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 gap-1.5 h-8 text-xs border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
