import { extractText } from "unpdf";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface PdfExtractionResult {
  totalPages: number;
  pages: ExtractedPage[];
  hasSelectableText: boolean;
  totalTextLength: number;
}

export class PdfExtractionError extends Error {
  constructor(message: string, public readonly code: "CORRUPTED" | "EMPTY" | "PASSWORD_PROTECTED" | "UNKNOWN") {
    super(message);
    this.name = "PdfExtractionError";
  }
}

/**
 * Extracts raw text page-by-page from a PDF buffer.
 * Performs deterministic detection for scanned/image-only documents.
 */
export async function extractPdfPages(buffer: Uint8Array): Promise<PdfExtractionResult> {
  if (!buffer || buffer.byteLength === 0) {
    throw new PdfExtractionError("The uploaded file is empty (0 bytes). Please upload a valid PDF document.", "EMPTY");
  }

  // Basic check for PDF magic bytes (%PDF-)
  const header = String.fromCharCode(...buffer.slice(0, 5));
  if (header !== "%PDF-") {
    throw new PdfExtractionError(
      `File format signature mismatch: Expected PDF header '%PDF-', but found '${header}'. The file may be corrupted or not a real PDF.`,
      "CORRUPTED"
    );
  }

  try {
    const { totalPages, text: pageTexts } = await extractText(buffer, { mergePages: false });

    if (totalPages === 0) {
      return {
        totalPages: 0,
        pages: [],
        hasSelectableText: false,
        totalTextLength: 0,
      };
    }

    const pages: ExtractedPage[] = pageTexts.map((rawText, idx) => {
      const text = rawText || "";
      return {
        pageNumber: idx + 1,
        text,
        charCount: text.trim().length,
      };
    });

    const totalTextLength = pages.reduce((sum, p) => sum + p.charCount, 0);

    // If total text across all pages is under 20 characters, it's either an empty or scanned document
    const hasSelectableText = totalTextLength >= 20;

    return {
      totalPages,
      pages,
      hasSelectableText,
      totalTextLength,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes("password") || message.toLowerCase().includes("encrypt")) {
      throw new PdfExtractionError(
        "This PDF is password-protected or encrypted. Please provide an unencrypted document to proceed with extraction.",
        "PASSWORD_PROTECTED"
      );
    }

    throw new PdfExtractionError(
      `Failed to parse PDF binary structure: ${message}. Ensure the file is a non-corrupted PDF.`,
      "CORRUPTED"
    );
  }
}
