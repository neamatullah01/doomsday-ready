import React, { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Zap, Loader2 } from 'lucide-react';

export const ColdStartBanner: React.FC = () => {
  const isFetching = useIsFetching();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isFetching > 0) {
      // If fetching takes longer than 3.5 seconds, show cold-start explanation
      timer = setTimeout(() => {
        setShowSlowNotice(true);
      }, 3500);
    } else {
      setShowSlowNotice(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFetching]);

  if (!showSlowNotice) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Zap className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-200 flex items-center gap-2">
            <span>Waking up cloud server</span>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
          </p>
          <p className="text-amber-300/80 text-xs mt-0.5">
            Render free-tier instances sleep when inactive. Waking the server may take ~30 seconds on initial load.
          </p>
        </div>
      </div>
    </div>
  );
};
