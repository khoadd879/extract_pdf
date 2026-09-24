"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DocumentInfo } from "@/components/DocumentInfo";
import { LineItemsTable } from "@/components/LineItemsTable";
import { RefusalList } from "@/components/RefusalList";
import { LoadingState } from "@/components/LoadingState";
import { ExtractionResult } from "@/lib/types";
import { exportToCsv, exportToJson } from "@/lib/export-utils";
import {
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
} from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [apiError, setApiError] = useState<{ error: string; detail: string } | null>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setApiError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Never collapse errors into "An error occurred"
        setApiError({
          error: data.error || `HTTP ${res.status} Error`,
          detail: data.detail || "The extraction service encountered an issue processing this document.",
        });
      } else {
        setResult(data as ExtractionResult);
      }
    } catch (err: unknown) {
      // Network or fetch failure with specific explanation
      setApiError({
        error: "Network Connection Failure",
        detail:
          err instanceof Error
            ? `Failed to communicate with extraction endpoint: ${err.message}`
            : "The browser could not establish a connection with the extraction service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">Insta Quote AI</h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Takeoff Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Auditable Takeoff with Evidence Tracing & Refusal Containment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full font-medium border border-emerald-200 dark:border-emerald-900/50">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Never Guesses Numbers
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Intro Guidance */}
        {!result && !isLoading && (
          <div className="text-center max-w-2xl mx-auto space-y-2 pt-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Deterministic PDF Line Item Takeoff
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Upload invoices, delivery dockets, or consolidated trade statements. Every quantity and price carries auditable evidence, and ambiguities or contradictions produce explicit, plain-language refusals.
            </p>
          </div>
        )}

        {/* Upload Zone */}
        <section className="max-w-2xl mx-auto w-full">
          <FileUpload onFileSelect={handleUpload} isLoading={isLoading} />
        </section>

        {/* Specific API Error Banner */}
        {apiError && (
          <section className="max-w-2xl mx-auto w-full">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{apiError.error}</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300/90 pl-6 leading-relaxed">
                {apiError.detail}
              </p>
            </div>
          </section>
        )}

        {/* Loading Progress State */}
        {isLoading && (
          <section className="max-w-3xl mx-auto w-full">
            <LoadingState />
          </section>
        )}

        {/* Results Presentation Area */}
        {result && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar with Exports */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Takeoff Audit Report
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportToCsv(result)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
                  title="Download line items and refusals as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportToJson(result)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-colors cursor-pointer"
                  title="Download complete structured extraction payload as JSON"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Document Metadata Card */}
            <DocumentInfo
              fileName={result.fileName}
              totalPages={result.totalPages}
              metadata={result.metadata}
              processingTimeMs={result.processingTimeMs}
            />

            {/* Refusal Reporting (Prominently displayed before table to highlight issues) */}
            <RefusalList refusals={result.refusals} />

            {/* Extracted Line Items Table with Evidence Viewer */}
            <LineItemsTable items={result.extractedItems} totals={result.totals} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 mt-auto bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Built for the Insta Quote AI Take-Home Assessment. Powered by TypeScript & Next.js.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Deterministic Rule Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
