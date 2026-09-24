"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const MAX_SIZE_MB = 15;

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setValidationError(null);

    // 1. Extension and MIME check
    const isPdf =
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setValidationError(
        `Invalid file type: "${file.name}" is not a PDF. Please upload a standard PDF invoice or docket.`
      );
      return;
    }

    // 2. Size check
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_SIZE_MB) {
      setValidationError(
        `File too large: "${file.name}" is ${sizeMb.toFixed(1)} MB. The maximum supported file size is ${MAX_SIZE_MB} MB.`
      );
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:bg-zinc-900/50"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700">
            <UploadCloud className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Click to upload or drag & drop PDF
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Invoices, delivery dockets, or consolidated statements (Max {MAX_SIZE_MB}MB)
            </p>
          </div>
        </div>

        {selectedFile && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full max-w-md shadow-sm"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="truncate text-left">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!isLoading && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove selected file"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
