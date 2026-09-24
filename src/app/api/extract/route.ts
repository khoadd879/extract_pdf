import { NextRequest, NextResponse } from "next/server";
import { extractPdfPages, PdfExtractionError } from "@/lib/pdf-extractor";
import { classifyAndExtractMetadata } from "@/lib/document-classifier";
import { ExtractionResult, Refusal } from "@/lib/types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Missing upload file",
          detail: "No file was attached in the 'file' field of the multipart request. Please select a valid PDF file to upload.",
          status: 400,
        },
        { status: 400 }
      );
    }

    // 1. Strict File Type Validation
    const isPdfMime = file.type === "application/pdf" || file.type === "application/x-pdf";
    const isPdfExtension = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfExtension) {
      return NextResponse.json(
        {
          error: "Unsupported file type",
          detail: `Only PDF documents can be processed. Received file '${file.name}' with MIME type '${file.type || "unknown"}'.`,
          status: 400,
        },
        { status: 400 }
      );
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: "File size limit exceeded",
          detail: `The uploaded file '${file.name}' is ${sizeMb} MB, which exceeds the maximum allowed limit of 15 MB.`,
          status: 413,
        },
        { status: 413 }
      );
    }

    // 3. Binary Extraction
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdfData = await extractPdfPages(buffer);
    const metadata = classifyAndExtractMetadata(pdfData.pages[0]?.text || "");
    const refusals: Refusal[] = [];

    // 4. Handle Scanned / Image-Only Document Refusal (Principle: Never guess)
    if (!pdfData.hasSelectableText) {
      refusals.push({
        field: "Document content",
        reason:
          "This document appears to be a scanned image or contains no selectable digital text. A text extraction service cannot extract line items without guessing. OCR pre-processing is required for image scans.",
        type: "illegible",
        pageNumber: 1,
        sourceText: null,
      });
    }

    // Check for empty pages in multi-page documents (e.g. IB-STMT47 page 4)
    if (pdfData.totalPages > 1) {
      for (const page of pdfData.pages) {
        if (page.charCount === 0) {
          refusals.push({
            field: `Page ${page.pageNumber}`,
            reason: `Page ${page.pageNumber} is blank or contains no extractable text layer.`,
            type: "missing",
            pageNumber: page.pageNumber,
            sourceText: null,
          });
        }
      }
    }

    const result: ExtractionResult = {
      fileName: file.name,
      totalPages: pdfData.totalPages,
      metadata,
      extractedItems: [],
      refusals,
      totals: null,
      hasSelectableText: pdfData.hasSelectableText,
      processingTimeMs: Date.now() - startTime,
      extractedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof PdfExtractionError) {
      return NextResponse.json(
        {
          error: "PDF extraction failed",
          detail: err.message,
          code: err.code,
          status: 422,
        },
        { status: 422 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Server processing error",
        detail: `An unexpected issue occurred while processing the PDF: ${message}`,
        status: 500,
      },
      { status: 500 }
    );
  }
}
