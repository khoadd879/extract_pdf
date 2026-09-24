import React from "react";
import { Loader2, ShieldCheck, Search, Layers } from "lucide-react";

export function LoadingState() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm text-center space-y-6 animate-pulse">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full border border-blue-200 dark:border-blue-900/50">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Processing & Auditing Document
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Applying strict evidence tracing and contradiction detection rules...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Page text extraction</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
          <Search className="w-4 h-4 text-purple-500 shrink-0" />
          <span>Tabular takeoff parser</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Grounding validation</span>
        </div>
      </div>
    </div>
  );
}
