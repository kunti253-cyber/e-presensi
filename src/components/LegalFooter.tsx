import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

interface LegalFooterProps {
  copyrightText?: string;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({ copyrightText = 'by Kunti Kunanti, M.Pd.' }) => {
  return (
    <div className="fixed bottom-3 right-3 z-30 no-print pointer-events-auto">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm text-xs text-slate-700 dark:text-slate-300 transition-all hover:shadow-md">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="font-medium tracking-tight">Legalitas Sistem:</span>
        <span className="font-semibold text-slate-900 dark:text-white font-mono">{copyrightText}</span>
      </div>
    </div>
  );
};
