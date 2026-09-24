"use client";

import React, { useState } from "react";
import { ExtractedLineItem, DocumentTotals } from "@/lib/types";
import { CheckCircle2, Copy, Check, Eye, HelpCircle } from "lucide-react";

interface LineItemsTableProps {
  items: ExtractedLineItem[];
  totals: DocumentTotals | null;
}

export function LineItemsTable({ items, totals }: LineItemsTableProps) {
  const [activeEvidence, setActiveEvidence] = useState<ExtractedLineItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No line items were extracted from this document.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden space-y-0">
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Extracted Line Items
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full font-medium">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Every quantity and price is grounded with exact page and source text evidence.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Grounded & Traceable</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4">Unit / Weight</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
            {items.map((item, idx) => (
              <tr
                key={`${item.code}-${idx}`}
                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <td className="py-3 px-4 text-center text-zinc-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                  {item.code || "—"}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.description}
                  </div>
                  {item.section && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      Section: {item.section}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold">
                  {item.quantity !== null ? item.quantity : "—"}
                </td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                  {item.rawWeight ? (
                    <span className="inline-flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300">
                      {item.rawWeight}
                    </span>
                  ) : (
                    item.unit || "—"
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium">
                  {item.totalPrice !== null ? (
                    formatCurrency(item.totalPrice)
                  ) : (
                    <span
                      title="No amount column present in table (see Refusals)"
                      className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50"
                    >
                      <HelpCircle className="w-3 h-3" /> Refused
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveEvidence(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
                  >
                    <Eye className="w-3 h-3 text-zinc-500" />
                    P.{item.evidence.pageNumber}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totals && (
        <div className="bg-zinc-50 dark:bg-zinc-800/40 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-end justify-end gap-6 text-xs">
          <div className="w-full sm:w-64 space-y-1.5">
            {totals.subtotal !== null && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
            )}
            {totals.gst !== null && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>GST (15%):</span>
                <span className="font-mono">{formatCurrency(totals.gst)}</span>
              </div>
            )}
            {totals.total !== null && (
              <div className="flex justify-between text-zinc-900 dark:text-zinc-100 font-semibold pt-1 border-t border-zinc-200 dark:border-zinc-700 text-sm">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(totals.total)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal / Dialog for Verbatim Evidence Inspection */}
      {activeEvidence && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setActiveEvidence(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 max-w-lg w-full shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Auditable Evidence Trace
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Item: <span className="font-mono text-blue-600">{activeEvidence.code}</span> — {activeEvidence.description}
                </p>
              </div>
              <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200 dark:border-blue-900/50">
                Page {activeEvidence.evidence.pageNumber}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Verbatim Source Text from PDF Layer
              </label>
              <div className="relative group bg-zinc-900 text-zinc-100 p-3.5 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800">
                {activeEvidence.evidence.sourceText}
                <button
                  type="button"
                  onClick={() => handleCopy(activeEvidence.evidence.sourceText)}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                  title="Copy verbatim source text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveEvidence(null)}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 rounded-lg text-xs font-medium transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
