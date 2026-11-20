import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/60 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Doomsday Ready</span>
          <span>•</span>
          <span>Blinto Talent Accelerator 2027 Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Calculation & Planning MVP</span>
          <span>•</span>
          <span className="text-slate-400">Single-User Mode</span>
        </div>
      </div>
    </footer>
  );
};
