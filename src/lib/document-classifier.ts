import { DocumentMetadata } from "./types";

/**
 * Classifies document type and parses header metadata with strict error isolation.
 * If any single field cannot be parsed, it remains null and does NOT throw.
 */
export function classifyAndExtractMetadata(page1Text: string): DocumentMetadata {
  const metadata: DocumentMetadata = {
    documentType: "unknown",
    documentNumber: null,
    date: null,
    billTo: null,
    jobRef: null,
  };

  if (!page1Text || page1Text.trim().length === 0) {
    return metadata;
  }

  // 1. Classify Document Type
  if (/Consolidated\s+Statement/i.test(page1Text)) {
    metadata.documentType = "consolidated_statement";
  } else if (/Tax\s+Invoice/i.test(page1Text)) {
    metadata.documentType = "tax_invoice";
  } else if (/Invoice/i.test(page1Text)) {
    metadata.documentType = "tax_invoice";
  }

  // 2. Extract Document Number
  try {
    const docNoMatch = page1Text.match(/Document\s+No[:\s]+([A-Za-z0-9_-]+)/i);
    if (docNoMatch && docNoMatch[1]) {
      metadata.documentNumber = docNoMatch[1].trim();
    }
  } catch {
    metadata.documentNumber = null;
  }

  // 3. Extract Date
  try {
    const dateMatch = page1Text.match(
      /Date[:\s]+(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i
    );
    if (dateMatch && dateMatch[1]) {
      metadata.date = dateMatch[1].trim();
    }
  } catch {
    metadata.date = null;
  }

  // 4. Extract Bill To
  try {
    const billToMatch = page1Text.match(/Bill\s+to[:\s]+([^\r\n]+)/i);
    if (billToMatch && billToMatch[1]) {
      metadata.billTo = billToMatch[1].trim();
    }
  } catch {
    metadata.billTo = null;
  }

  // 5. Extract Job Ref
  try {
    const jobRefMatch = page1Text.match(/Job\s+ref[:\s]+([^\r\n]+)/i);
    if (jobRefMatch && jobRefMatch[1]) {
      metadata.jobRef = jobRefMatch[1].trim();
    }
  } catch {
    metadata.jobRef = null;
  }

  // 6. Extract Summary Note (e.g., "Summary: 9 cartons dispatched...")
  try {
    const summaryMatch = page1Text.match(/Summary[:\s]+([^\r\n]+)/i);
    if (summaryMatch && summaryMatch[1]) {
      metadata.summaryNote = summaryMatch[1].trim();
    }
  } catch {
    metadata.summaryNote = null;
  }

  // 7. Extract Warehouse Note (e.g., "Warehouse notes: 11 cartons picked...")
  try {
    const warehouseMatch = page1Text.match(/Warehouse\s+notes?[:\s]+([^\r\n]+)/i);
    if (warehouseMatch && warehouseMatch[1]) {
      metadata.warehouseNote = warehouseMatch[1].trim();
    }
  } catch {
    metadata.warehouseNote = null;
  }

  return metadata;
}
