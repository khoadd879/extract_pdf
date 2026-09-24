import { ExtractedLineItem, DocumentTotals, Refusal } from "./types";
import { ExtractedPage } from "./pdf-extractor";

const STANDARD_LINE_REGEX =
  /^([A-Za-z0-9_-]+)\s+(.+?)\s+([0-9]+)\s+([a-zA-Z]+)\s+\$([0-9,]+\.[0-9]{2})\s+\$([0-9,]+\.[0-9]{2})$/;

const WEIGHT_LINE_REGEX =
  /^([A-Za-z0-9_-]+)\s+(.+?)\s+([0-9]+)\s+([0-9.]+\s*(?:kg|g|ton|tonne|t)(?:\s+[a-zA-Z]+)?)\s+\$([0-9,]+\.[0-9]{2})\s*(?:\/([a-zA-Z]+))?$/;

const ITEM_CODE_CANDIDATE_REGEX = /^[A-Z]{2,4}-[0-9]{3,4}\b/;

export interface ParseResult {
  items: ExtractedLineItem[];
  refusals: Refusal[];
  totals: DocumentTotals | null;
}

function parseCurrency(str: string): number {
  return parseFloat(str.replace(/,/g, ""));
}

/**
 * Extracts section heading from a page if present (e.g. for Consolidated Statements)
 */
function extractSectionTitle(lines: string[]): string | null {
  for (const line of lines.slice(0, 5)) {
    const match = line.match(/Consolidated\s+Statement\s+Run\s+\d+\s+-\s+(.+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Parses document line items and totals with per-line error isolation.
 * A malformed row will produce an isolated Refusal rather than crashing document extraction.
 */
export function parseDocumentLineItems(pages: ExtractedPage[]): ParseResult {
  const items: ExtractedLineItem[] = [];
  const refusals: Refusal[] = [];
  let parsedTotals: DocumentTotals | null = null;

  for (const page of pages) {
    const pageNumber = page.pageNumber;
    const pageText = page.text || "";

    if (!pageText.trim()) {
      continue;
    }

    const lines = pageText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const sectionTitle = extractSectionTitle(lines);

    // Track table state
    let inTable = false;
    let isWeightTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Detect Header row
      if (
        /Code/i.test(line) &&
        /Description/i.test(line) &&
        /Qty/i.test(line) &&
        /Price/i.test(line)
      ) {
        inTable = true;
        isWeightTable = /Weight/i.test(line);
        continue;
      }

      // Skip table horizontal rule (e.g. "-------------------")
      if (/^-{5,}$/.test(line)) {
        continue;
      }

      // 2. Parse Totals after table
      const subtotalMatch = line.match(/Subtotal:\s+\$([0-9,]+\.[0-9]{2})/i);
      if (subtotalMatch) {
        inTable = false;
        if (!parsedTotals) {
          parsedTotals = { subtotal: null, gst: null, total: null };
        }
        parsedTotals.subtotal = parseCurrency(subtotalMatch[1]);
        continue;
      }

      const gstMatch = line.match(/GST\s*(?:\([0-9]+%?\))?:\s+\$([0-9,]+\.[0-9]{2})/i);
      if (gstMatch) {
        inTable = false;
        if (!parsedTotals) {
          parsedTotals = { subtotal: null, gst: null, total: null };
        }
        parsedTotals.gst = parseCurrency(gstMatch[1]);
        continue;
      }

      const totalMatch = line.match(/Total(?:\s*\(incl\s*GST\))?:\s+\$([0-9,]+\.[0-9]{2})/i);
      if (totalMatch) {
        inTable = false;
        if (!parsedTotals) {
          parsedTotals = { subtotal: null, gst: null, total: null };
        }
        parsedTotals.total = parseCurrency(totalMatch[1]);
        continue;
      }

      // Check for footer / end of table markers
      if (/^(?:Total\s+consignment|Warehouse\s+notes|Payment\s+due|Page\s+\d+\s+of\s+\d+)/i.test(line)) {
        inTable = false;
      }

      // 3. Parse Table Rows with Error Isolation
      if (inTable || ITEM_CODE_CANDIDATE_REGEX.test(line)) {
        try {
          if (isWeightTable) {
            const weightMatch = line.match(WEIGHT_LINE_REGEX);
            if (weightMatch) {
              const code = weightMatch[1];
              const description = weightMatch[2].trim();
              const quantity = parseInt(weightMatch[3], 10);
              const rawWeight = weightMatch[4].trim();
              const unitPrice = parseCurrency(weightMatch[5]);
              const unit = weightMatch[6] ? weightMatch[6].toLowerCase() : null;

              items.push({
                code,
                description,
                quantity,
                unit,
                unitPrice,
                totalPrice: null, // Explicitly null: never guess amount without an Amount column
                rawWeight,
                section: sectionTitle,
                evidence: {
                  pageNumber,
                  sourceText: line,
                },
              });

              // Explicit refusal for missing line total amount
              refusals.push({
                field: `Total price for item '${code}'`,
                reason: `The table on page ${pageNumber} has a 'Weight' column instead of an 'Amount' column. Without an explicit amount column, total line price is refused to avoid guessing.`,
                type: "missing",
                pageNumber,
                sourceText: line,
              });
              continue;
            }
          }

          // Try standard layout
          const stdMatch = line.match(STANDARD_LINE_REGEX);
          if (stdMatch) {
            const code = stdMatch[1];
            const description = stdMatch[2].trim();
            const quantity = parseInt(stdMatch[3], 10);
            const unit = stdMatch[4].toLowerCase();
            const unitPrice = parseCurrency(stdMatch[5]);
            const totalPrice = parseCurrency(stdMatch[6]);

            items.push({
              code,
              description,
              quantity,
              unit,
              unitPrice,
              totalPrice,
              section: sectionTitle,
              evidence: {
                pageNumber,
                sourceText: line,
              },
            });
            continue;
          }

          // If the line started with an item code (e.g. FX-999) but failed regex matching,
          // isolate the failure as a refusal for this row only!
          if (ITEM_CODE_CANDIDATE_REGEX.test(line)) {
            refusals.push({
              field: `Line item row on page ${pageNumber}`,
              reason: `Line item code detected but fields could not be cleanly mapped to known column specifications: "${line}".`,
              type: "ambiguous",
              pageNumber,
              sourceText: line,
            });
          }
        } catch (err: unknown) {
          // Robust error isolation: single row parsing error never halts extraction
          refusals.push({
            field: `Line item row on page ${pageNumber}`,
            reason: `Unexpected parsing exception on row: ${err instanceof Error ? err.message : String(err)}`,
            type: "ambiguous",
            pageNumber,
            sourceText: line,
          });
        }
      }
    }
  }

  return {
    items,
    refusals,
    totals: parsedTotals,
  };
}
