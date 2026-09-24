import React from "react";
import { DocumentMetadata } from "@/lib/types";
import { FileText, Calendar, Building, Hash, Clock, Layers } from "lucide-react";

interface DocumentInfoProps {
  fileName: string;
  totalPages: number;
  metadata: DocumentMetadata;
  processingTimeMs: number;
}

export function DocumentInfo({
  fileName,
  totalPages,
  metadata,
  processingTimeMs,
}: DocumentInfoProps) {
  const isStatement = metadata.documentType === "consolidated_statement";
  const typeLabel = isStatement
    ? "Consolidated Statement"
    : metadata.documentType === "tax_invoice"
    ? "Tax Invoice"
    : "Document";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {metadata.documentNumber || fileName}
              </h2>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isStatement
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                }`}
              >
                {typeLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Source file: <span className="font-mono text-zinc-700 dark:text-zinc-300">{fileName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {totalPages} {totalPages === 1 ? "page" : "pages"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {processingTimeMs} ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Date
          </span>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {metadata.date || "Not specified"}
          </p>
        </div>

        <div>
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Building className="w-3.5 h-3.5" /> Bill To
          </span>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {metadata.billTo || "Not specified"}
          </p>
        </div>

        <div>
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <Hash className="w-3.5 h-3.5" /> Job Reference
          </span>
          <p className="font-medium text-zinc-900 dark:text-zinc-100 font-mono">
            {metadata.jobRef || "None"}
          </p>
        </div>

        <div>
          <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
            <FileText className="w-3.5 h-3.5" /> Issuer
          </span>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Ironbark Trade Merchants
          </p>
        </div>
      </div>

      {(metadata.summaryNote || metadata.warehouseNote) && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5 text-xs">
          {metadata.summaryNote && (
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Summary note:</span>{" "}
              {metadata.summaryNote}
            </p>
          )}
          {metadata.warehouseNote && (
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Warehouse notes:</span>{" "}
              {metadata.warehouseNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
