import React from "react";
import { Refusal, RefusalType } from "@/lib/types";
import { AlertTriangle, XOctagon, FileQuestion, HelpCircle, Layers } from "lucide-react";

interface RefusalListProps {
  refusals: Refusal[];
}

interface TypeConfig {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
  description: string;
}

const TYPE_CONFIG: Record<RefusalType, TypeConfig> = {
  contradictory: {
    label: "Contradiction Detected",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300 dark:border-red-800",
    icon: <XOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />,
    description: "Two or more sections of the document provide conflicting values.",
  },
  illegible: {
    label: "Unreadable / Scanned",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
    description: "The document is an image scan without selectable text.",
  },
  missing: {
    label: "Missing Information",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    icon: <FileQuestion className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    description: "The expected data column or page content was not provided.",
  },
  ambiguous: {
    label: "Ambiguity Detected",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    icon: <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    description: "The data could not be mapped with certainty without guessing.",
  },
};

export function RefusalList({ refusals }: RefusalListProps) {
  if (refusals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-amber-100 dark:border-amber-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 dark:bg-amber-950/80 rounded-lg text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Document Refusals & Discrepancies
              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {refusals.length}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Insta Quote AI strictly refuses to guess numbers. Below is everything we withheld, explained in plain language.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {refusals.map((refusal, idx) => {
          const config = TYPE_CONFIG[refusal.type] || TYPE_CONFIG.ambiguous;

          return (
            <div
              key={`${refusal.field}-${idx}`}
              className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/70 space-y-2.5 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="shrink-0">{config.icon}</span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {refusal.field}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {refusal.pageNumber !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                      <Layers className="w-3 h-3" /> Page {refusal.pageNumber}
                    </span>
                  )}

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Plain language explanation for non-technical users */}
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pl-6">
                {refusal.reason}
              </p>

              {/* Verbatim source text context if present */}
              {refusal.sourceText && (
                <div className="ml-6 mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 break-all">
                  <span className="text-zinc-400 dark:text-zinc-500 font-sans block text-[10px] uppercase font-semibold mb-0.5">
                    Source text in document:
                  </span>
                  &ldquo;{refusal.sourceText}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
