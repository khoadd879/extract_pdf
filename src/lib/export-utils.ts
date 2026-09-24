import { ExtractionResult } from "./types";

/**
 * Triggers a browser download of a string content as a file
 */
function downloadFile(content: string, fileName: string, contentType: string) {
  if (typeof document === "undefined") return;

  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted JSON string for extraction result
 */
export function generateJsonContent(result: ExtractionResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Generates CSV string for extraction result with UTF-8 BOM, escaped values,
 * and sections for metadata, line items, and refusals.
 */
export function generateCsvContent(result: ExtractionResult): string {
  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];

  // UTF-8 BOM so spreadsheet apps (like Excel) render correctly
  const BOM = "\uFEFF";

  // Section 1: Document Metadata
  rows.push("DOCUMENT METADATA");
  rows.push(`File Name,${escapeCsv(result.fileName)}`);
  rows.push(`Document Number,${escapeCsv(result.metadata.documentNumber)}`);
  rows.push(`Document Type,${escapeCsv(result.metadata.documentType)}`);
  rows.push(`Date,${escapeCsv(result.metadata.date)}`);
  rows.push(`Bill To,${escapeCsv(result.metadata.billTo)}`);
  rows.push(`Job Ref,${escapeCsv(result.metadata.jobRef)}`);
  rows.push(`Total Pages,${escapeCsv(result.totalPages)}`);
  rows.push(`Extracted At,${escapeCsv(result.extractedAt)}`);
  rows.push(""); // empty separator line

  // Section 2: Extracted Line Items
  rows.push("EXTRACTED LINE ITEMS");
  rows.push(
    [
      "Line",
      "Code",
      "Description",
      "Section",
      "Quantity",
      "Unit / Weight",
      "Unit Price ($)",
      "Amount ($)",
      "Evidence Page",
      "Verbatim Source Text",
    ].join(",")
  );

  if (result.extractedItems.length === 0) {
    rows.push("No line items extracted");
  } else {
    result.extractedItems.forEach((item, idx) => {
      rows.push(
        [
          escapeCsv(idx + 1),
          escapeCsv(item.code),
          escapeCsv(item.description),
          escapeCsv(item.section || ""),
          escapeCsv(item.quantity),
          escapeCsv(item.rawWeight || item.unit || ""),
          escapeCsv(item.unitPrice !== null ? item.unitPrice.toFixed(2) : ""),
          escapeCsv(item.totalPrice !== null ? item.totalPrice.toFixed(2) : "REFUSED"),
          escapeCsv(item.evidence.pageNumber),
          escapeCsv(item.evidence.sourceText),
        ].join(",")
      );
    });
  }

  // Financial totals if present
  if (result.totals) {
    rows.push("");
    rows.push(`Subtotal,,,,,${escapeCsv(result.totals.subtotal !== null ? result.totals.subtotal.toFixed(2) : "")}`);
    rows.push(`GST (15%),,,,,${escapeCsv(result.totals.gst !== null ? result.totals.gst.toFixed(2) : "")}`);
    rows.push(`Total,,,,,${escapeCsv(result.totals.total !== null ? result.totals.total.toFixed(2) : "")}`);
  }

  // Section 3: Document Refusals (if any)
  if (result.refusals.length > 0) {
    rows.push("");
    rows.push("DOCUMENT REFUSALS & DISCREPANCIES (NEVER GUESSED)");
    rows.push(["Refusal #", "Field", "Type", "Page", "Reason", "Problematic Source Text"].join(","));

    result.refusals.forEach((refusal, idx) => {
      rows.push(
        [
          escapeCsv(idx + 1),
          escapeCsv(refusal.field),
          escapeCsv(refusal.type),
          escapeCsv(refusal.pageNumber),
          escapeCsv(refusal.reason),
          escapeCsv(refusal.sourceText || ""),
        ].join(",")
      );
    });
  }

  return BOM + rows.join("\r\n");
}

/**
 * Triggers download of complete extraction result as formatted JSON
 */
export function exportToJson(result: ExtractionResult) {
  const jsonString = generateJsonContent(result);
  const baseName = (result.metadata.documentNumber || result.fileName.replace(/\.pdf$/i, "")).trim();
  downloadFile(jsonString, `${baseName}-extraction.json`, "application/json");
}

/**
 * Triggers download of extracted line items and refusals as CSV
 */
export function exportToCsv(result: ExtractionResult) {
  const csvContent = generateCsvContent(result);
  const baseName = (result.metadata.documentNumber || result.fileName.replace(/\.pdf$/i, "")).trim();
  downloadFile(csvContent, `${baseName}-extraction.csv`, "text/csv;charset=utf-8;");
}
