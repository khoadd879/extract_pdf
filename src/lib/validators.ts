import { ExtractedLineItem, DocumentMetadata, DocumentTotals, Refusal } from "./types";
import { ExtractedPage } from "./pdf-extractor";

export interface ValidationResult {
  refusals: Refusal[];
}

/**
 * Validates document for internal contradictions, mathematical inconsistencies,
 * and auditable grounding. Wrapped in error isolation.
 */
export function validateExtraction(
  items: ExtractedLineItem[],
  metadata: DocumentMetadata,
  totals: DocumentTotals | null,
  pages: ExtractedPage[]
): ValidationResult {
  const refusals: Refusal[] = [];

  // 1. Detect Explicit Contradictions in Document Notes (e.g. IB-56088 9 cartons vs 11 cartons)
  try {
    if (metadata.summaryNote && metadata.warehouseNote) {
      const summaryCartons = metadata.summaryNote.match(/(\d+)\s+cartons?/i);
      const warehouseCartons = metadata.warehouseNote.match(/(\d+)\s+cartons?/i);

      if (summaryCartons && warehouseCartons && summaryCartons[1] !== warehouseCartons[1]) {
        refusals.push({
          field: "Dispatched vs picked carton count",
          reason: `The document contains conflicting carton counts: the summary section states '${summaryCartons[1]} cartons dispatched', whereas the warehouse notes state '${warehouseCartons[1]} cartons picked and loaded'. Neither value can be verified as authoritative without external confirmation.`,
          type: "contradictory",
          pageNumber: 1,
          sourceText: `Summary: "${metadata.summaryNote}" vs Warehouse notes: "${metadata.warehouseNote}"`,
        });
      }
    }
  } catch (err: unknown) {
    console.error("Contradiction validator error:", err);
  }

  // 2. Check for Missing Tax Breakdown on Invoices (e.g. IB-56088)
  try {
    if (metadata.documentType === "tax_invoice" && totals?.total && !totals?.gst && !totals?.subtotal) {
      refusals.push({
        field: "GST & Subtotal breakdown",
        reason: `The document is titled 'Tax Invoice' and gives a final total of $${totals.total.toFixed(2)}, but omits the itemized Subtotal and GST breakdown required for standard tax compliance.`,
        type: "missing",
        pageNumber: 1,
        sourceText: `Total: $${totals.total.toFixed(2)}`,
      });
    }
  } catch (err: unknown) {
    console.error("Tax breakdown validator error:", err);
  }

  // 3. Mathematical Reconciliation (Line Items Sum vs Stated Subtotal)
  try {
    const itemsWithTotal = items.filter((i) => i.totalPrice !== null);
    if (itemsWithTotal.length > 0 && totals?.subtotal !== null && totals?.subtotal !== undefined) {
      const calculatedSum = itemsWithTotal.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const diff = Math.abs(calculatedSum - totals.subtotal);

      // Allow 1 cent rounding difference
      if (diff > 0.02) {
        refusals.push({
          field: "Line items to Subtotal reconciliation",
          reason: `The sum of extracted line item amounts ($${calculatedSum.toFixed(2)}) contradicts the stated Subtotal ($${totals.subtotal.toFixed(2)}), differing by $${diff.toFixed(2)}.`,
          type: "contradictory",
          pageNumber: 1,
          sourceText: `Calculated sum: $${calculatedSum.toFixed(2)}, Stated subtotal: $${totals.subtotal.toFixed(2)}`,
        });
      }
    }
  } catch (err: unknown) {
    console.error("Math reconciliation validator error:", err);
  }

  // 4. Grounding Verification (Every item sourceText must exist verbatim in the page)
  try {
    for (const item of items) {
      const page = pages.find((p) => p.pageNumber === item.evidence.pageNumber);
      if (!page || !page.text.includes(item.evidence.sourceText)) {
        refusals.push({
          field: `Grounding evidence for item '${item.code || item.description}'`,
          reason: `The extracted source text could not be verified verbatim against the raw content of page ${item.evidence.pageNumber}.`,
          type: "ambiguous",
          pageNumber: item.evidence.pageNumber,
          sourceText: item.evidence.sourceText,
        });
      }
    }
  } catch (err: unknown) {
    console.error("Grounding validator error:", err);
  }

  return { refusals };
}
